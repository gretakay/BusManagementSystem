import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { bulkReassignSchema } from "@/lib/validation/passenger";
import type { Passenger } from "@/types/passenger";

const BATCH_LIMIT = 450;

/**
 * 排車「批次指派」:一次把多位人員改到同一車次(依 leg 決定改去程 busId 或回程 returnBusId)。
 * 原本前端是一個一個呼叫單筆 PATCH(N 個人就是 N 次序列化 API 往返),選取人數一多就明顯變慢;
 * 這裡改成單一請求 + Firestore batch write,一次搞定。
 * 批次指派去程時,回程若還沒被明確設定過,預設一併同步成同一台車,個別例外之後再手動調整回程即可。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { passengerIds, leg, busId, busGroup } = bulkReassignSchema.parse(await req.json());
    const field = leg === "return" ? "returnBusId" : "busId";

    const db = getAdminDb();
    const col = db.collection("trips").doc(params.tripId).collection("passengers");
    const now = new Date().toISOString();

    let updatedCount = 0;
    for (let i = 0; i < passengerIds.length; i += BATCH_LIMIT) {
      const chunk = passengerIds.slice(i, i + BATCH_LIMIT);

      let returnBusIdByPassenger: Map<string, string | null> | null = null;
      if (leg !== "return") {
        const snaps = await Promise.all(chunk.map((id) => col.doc(id).get()));
        returnBusIdByPassenger = new Map(
          snaps.filter((s) => s.exists).map((s) => [s.id, (s.data() as Passenger).returnBusId ?? null]),
        );
      }

      const batch = db.batch();
      for (const id of chunk) {
        const update: Record<string, unknown> = { [field]: busId, updatedAt: now };
        if (returnBusIdByPassenger && returnBusIdByPassenger.get(id) == null) {
          update.returnBusId = busId;
        }
        if (busGroup !== undefined) update.busGroup = busGroup;
        batch.update(col.doc(id), update);
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
      detail: { passengerCount: updatedCount, leg, busId, busGroup },
    });

    return NextResponse.json({ updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
