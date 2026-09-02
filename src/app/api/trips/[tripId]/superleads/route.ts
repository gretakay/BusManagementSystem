import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead, findUserByEmail } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { assignTripSuperLeadSchema, removeTripSuperLeadSchema } from "@/lib/validation/trip";
import type { Trip, TripSuperLeadAssignment } from "@/types/trip";

/**
 * 指派/移除單一行程的總領隊(trip-scoped superLead,區別於全域的 globalSuperLead)。
 * 權限真正生效的地方是 roles/{uid} 文件(trips.{tripId}.superLead),
 * trip.superLeads 陣列只是方便畫面顯示用的展開資料(denormalized),兩者一併寫入以保持同步。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    const { email } = assignTripSuperLeadSchema.parse(await req.json());

    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json(
        { error: `找不到 email 為 ${email} 的帳號,請先到「帳號管理」建立此帳號` },
        { status: 404 },
      );
    }

    const db = getAdminDb();
    const tripRef = db.collection("trips").doc(params.tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    const roleRef = db.collection("roles").doc(targetUser.uid);
    const existingRoleSnap = await roleRef.get();
    const displayName = existingRoleSnap.data()?.displayName as string | undefined;

    await roleRef.set(
      {
        email: targetUser.email ?? email,
        trips: { [params.tripId]: { superLead: true } },
      },
      { merge: true },
    );

    const trip = tripSnap.data() as Trip;
    const nextSuperLeads: TripSuperLeadAssignment[] = [
      ...(trip.superLeads ?? []).filter((s) => s.uid !== targetUser.uid),
      { uid: targetUser.uid, email: targetUser.email ?? email, ...(displayName ? { displayName } : {}) },
    ];
    await tripRef.update({ superLeads: nextSuperLeads });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "trip.assignSuperLead",
      tripId: params.tripId,
      targetType: "trip",
      targetId: params.tripId,
      detail: { assignedUid: targetUser.uid, email },
    });

    return NextResponse.json({ superLeads: nextSuperLeads });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    const { uid } = removeTripSuperLeadSchema.parse(await req.json());

    const db = getAdminDb();
    const tripRef = db.collection("trips").doc(params.tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    await db
      .collection("roles")
      .doc(uid)
      .update({ [`trips.${params.tripId}.superLead`]: false })
      .catch(() => {
        // 角色文件本來就沒有此欄位,略過即可
      });

    const trip = tripSnap.data() as Trip;
    const nextSuperLeads = (trip.superLeads ?? []).filter((s) => s.uid !== uid);
    await tripRef.update({ superLeads: nextSuperLeads });

    return NextResponse.json({ superLeads: nextSuperLeads });
  } catch (error) {
    return handleApiError(error);
  }
}
