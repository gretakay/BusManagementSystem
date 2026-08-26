import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

/**
 * 解除封存(規格書 §5.7):僅總領隊/師父可操作,不設重新開啟次數限制。
 * 封存本身由排程 Cloud Function 自動執行(見 functions/src/index.ts),此路由只處理手動解除封存。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const db = getAdminDb();
    const ref = db.collection("trips").doc(params.tripId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }
    if (snap.data()?.status !== "archived") {
      return NextResponse.json({ error: "行程目前並非封存狀態" }, { status: 409 });
    }

    await ref.update({ status: "ended", archivedAt: null });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "trip.unarchive",
      tripId: params.tripId,
      targetType: "trip",
      targetId: params.tripId,
    });

    const updated = await ref.get();
    return NextResponse.json(updated.data());
  } catch (error) {
    return handleApiError(error);
  }
}
