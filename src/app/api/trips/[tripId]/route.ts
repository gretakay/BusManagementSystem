import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { updateTripSchema } from "@/lib/validation/trip";

export async function PATCH(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const input = updateTripSchema.parse(await req.json());
    const db = getAdminDb();
    const ref = db.collection("trips").doc(params.tripId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }
    if (snap.data()?.status === "archived") {
      return NextResponse.json({ error: "行程已封存,請先解除封存後再編輯" }, { status: 409 });
    }

    await ref.update({ ...input });
    const updated = await ref.get();
    return NextResponse.json(updated.data());
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 永久刪除行程,連同車輛/點名紀錄/乘客名單一併清除(regular recursiveDelete)。
 * 與建立行程一樣限定全域總負責人才能操作,行程專屬總領隊不可刪除,避免誤刪超出自己職責的資料。
 */
export async function DELETE(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);

    const db = getAdminDb();
    const ref = db.collection("trips").doc(params.tripId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "trip.delete",
      tripId: params.tripId,
      targetType: "trip",
      targetId: params.tripId,
      detail: { name: snap.data()?.name },
    });

    await db.recursiveDelete(ref);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
