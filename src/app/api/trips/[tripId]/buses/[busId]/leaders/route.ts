import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireTripSuperLead, findOrCreateUserByEmail } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { assignBusLeaderSchema, removeBusLeaderSchema } from "@/lib/validation/bus";
import type { Bus, BusLeaderAssignment } from "@/types/bus";

/**
 * 指派/移除車輛的領隊、副領隊、小組長。
 * 權限真正生效的地方是 roles/{uid} 文件(Firestore Rules 依此判斷),
 * bus.leaders 陣列只是方便畫面顯示用的展開資料(denormalized),兩者在此一併寫入以保持同步。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string; busId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    const { email, role, password, groupTag } = assignBusLeaderSchema.parse(await req.json());

    const targetUser = await findOrCreateUserByEmail(email, password);
    if (!targetUser) {
      return NextResponse.json(
        { error: `找不到 email 為 ${email} 的帳號,請填密碼幫對方建立新帳號,或請對方先自行註冊/登入` },
        { status: 404 },
      );
    }

    const db = getAdminDb();
    const busRef = db.collection("trips").doc(params.tripId).collection("buses").doc(params.busId);
    const busSnap = await busRef.get();
    if (!busSnap.exists) {
      return NextResponse.json({ error: "車輛不存在" }, { status: 404 });
    }

    const roleRef = db.collection("roles").doc(targetUser.uid);
    await roleRef.set(
      {
        email: targetUser.email ?? email,
        trips: {
          [params.tripId]: {
            busRoles: { [params.busId]: groupTag ? { role, groupTag } : { role } },
          },
        },
      },
      { merge: true },
    );

    const bus = busSnap.data() as Bus;
    const nextLeaders: BusLeaderAssignment[] = [
      ...bus.leaders.filter((l) => l.uid !== targetUser.uid),
      { uid: targetUser.uid, email: targetUser.email ?? email, role, ...(groupTag ? { groupTag } : {}) },
    ];
    await busRef.update({ leaders: nextLeaders });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "bus.assignLeader",
      tripId: params.tripId,
      targetType: "bus",
      targetId: params.busId,
      detail: { assignedUid: targetUser.uid, email, role, groupTag },
    });

    return NextResponse.json({ leaders: nextLeaders });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tripId: string; busId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    const { uid } = removeBusLeaderSchema.parse(await req.json());

    const db = getAdminDb();
    const busRef = db.collection("trips").doc(params.tripId).collection("buses").doc(params.busId);
    const busSnap = await busRef.get();
    if (!busSnap.exists) {
      return NextResponse.json({ error: "車輛不存在" }, { status: 404 });
    }

    await db
      .collection("roles")
      .doc(uid)
      .update({ [`trips.${params.tripId}.busRoles.${params.busId}`]: FieldValue.delete() })
      .catch(() => {
        // 角色文件本來就沒有此欄位,略過即可
      });

    const bus = busSnap.data() as Bus;
    const nextLeaders = bus.leaders.filter((l) => l.uid !== uid);
    await busRef.update({ leaders: nextLeaders });

    return NextResponse.json({ leaders: nextLeaders });
  } catch (error) {
    return handleApiError(error);
  }
}
