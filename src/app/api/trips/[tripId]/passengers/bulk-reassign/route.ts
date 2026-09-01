import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

const BATCH_LIMIT = 450;

const bulkReassignSchema = z.object({
  passengerIds: z.array(z.string().trim().min(1)).min(1, "請至少選擇一位人員"),
  busId: z.string().trim().nullable(),
});

/**
 * 排車「批次指派」:一次把多位人員改到同一車次。
 * 原本前端是一個一個呼叫單筆 PATCH(N 個人就是 N 次序列化 API 往返),選取人數一多就明顯變慢;
 * 這裡改成單一請求 + Firestore batch write,一次搞定。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { passengerIds, busId } = bulkReassignSchema.parse(await req.json());

    const db = getAdminDb();
    const col = db.collection("trips").doc(params.tripId).collection("passengers");
    const now = new Date().toISOString();

    let updatedCount = 0;
    for (let i = 0; i < passengerIds.length; i += BATCH_LIMIT) {
      const chunk = passengerIds.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(col.doc(id), { busId, updatedAt: now });
        updatedCount += 1;
      }
      await batch.commit();
    }

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "passenger.bulkReassign",
      tripId: params.tripId,
      targetType: "passenger",
      detail: { passengerCount: updatedCount, busId },
    });

    return NextResponse.json({ updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
