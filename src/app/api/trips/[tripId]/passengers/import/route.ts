import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { encryptField, phoneLast4 } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { importPassengersSchema } from "@/lib/validation/passenger";
import type { ImportPassengersResult, Passenger } from "@/types/passenger";

const BATCH_LIMIT = 450;

/**
 * 批次匯入(Excel/CSV,規格書 §5.2)。檔案解析在前端完成(xlsx),這裡只收 JSON rows。
 * 以 regNo 作為比對鍵值:同一行程內已存在則更新(Upsert),不存在則新增,
 * 讓活動前名單異動可重新匯入同一份檔案覆蓋更新,不必每次清空重建。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { rows } = importPassengersSchema.parse(await req.json());

    const result: ImportPassengersResult = { createdCount: 0, updatedCount: 0, errors: [] };

    // 檔案內部序號重複檢查
    const seen = new Map<string, number>();
    rows.forEach((row, idx) => {
      if (seen.has(row.regNo)) {
        result.errors.push({
          row: idx + 1,
          regNo: row.regNo,
          message: `報名序號重複出現於第 ${seen.get(row.regNo)! + 1} 列與第 ${idx + 1} 列`,
        });
      } else {
        seen.set(row.regNo, idx);
      }
    });

    const validRows = rows.filter((row) => !result.errors.some((e) => e.regNo === row.regNo));
    if (validRows.length === 0) {
      return NextResponse.json(result, { status: 200 });
    }

    const db = getAdminDb();
    const col = db.collection("trips").doc(params.tripId).collection("passengers");
    const now = new Date().toISOString();

    for (let i = 0; i < validRows.length; i += BATCH_LIMIT) {
      const chunk = validRows.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();

      for (const row of chunk) {
        const existingSnap = await col.where("regNo", "==", row.regNo).limit(1).get();
        const ref = existingSnap.empty ? col.doc() : existingSnap.docs[0]!.ref;
        const existing = existingSnap.empty ? null : (existingSnap.docs[0]!.data() as Passenger);

        const passenger: Passenger = {
          id: ref.id,
          tripId: params.tripId,
          busId: row.busId ?? existing?.busId ?? null,
          name: row.name,
          dharmaName: row.dharmaName ?? "",
          phoneEnc: encryptField(row.phone),
          phoneLast4: phoneLast4(row.phone),
          identity: row.identity,
          volunteerGroup: row.identity === "volunteer" ? row.volunteerGroup ?? "" : "",
          emergencyContactName: row.emergencyContactName ?? "",
          emergencyContactPhoneEnc: row.emergencyContactPhone
            ? encryptField(row.emergencyContactPhone)
            : "",
          regNo: row.regNo,
          lodgingInfo: row.lodgingInfo ?? "",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        batch.set(ref, passenger);
        if (existing) result.updatedCount += 1;
        else result.createdCount += 1;
      }

      await batch.commit();
    }

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "passenger.import",
      tripId: params.tripId,
      targetType: "passenger",
      detail: {
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        errorCount: result.errors.length,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
