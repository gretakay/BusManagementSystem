import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import type { Bus } from "@/types/bus";
import type { Trip } from "@/types/trip";

const resetPasswordSchema = z.object({
  uid: z.string().trim().min(1),
  password: z.string().min(6, "密碼至少 6 碼"),
});

/**
 * 總領隊直接幫「此行程內的領隊/副領隊/小組長/總領隊」重設密碼,不需要 email 寄信、也不用 Firebase Console。
 * 為避免行程總領隊越權重設不相干帳號的密碼,先確認目標 uid 確實是此行程的角色成員才允許重設。
 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    const { uid, password } = resetPasswordSchema.parse(await req.json());

    const db = getAdminDb();
    const tripSnap = await db.collection("trips").doc(params.tripId).get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    const trip = tripSnap.data() as Trip;
    const isTripSuperLeadTarget = (trip.superLeads ?? []).some((s) => s.uid === uid);

    let isBusLeaderTarget = false;
    if (!isTripSuperLeadTarget) {
      const busesSnap = await db.collection("trips").doc(params.tripId).collection("buses").get();
      isBusLeaderTarget = busesSnap.docs.some((d) =>
        (d.data() as Bus).leaders.some((l) => l.uid === uid),
      );
    }

    if (!isTripSuperLeadTarget && !isBusLeaderTarget) {
      return NextResponse.json(
        { error: "此使用者不是此行程的領隊或總領隊,無法重設密碼" },
        { status: 403 },
      );
    }

    await getAdminAuth().updateUser(uid, { password });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "user.resetPassword",
      tripId: params.tripId,
      targetType: "user",
      targetId: uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
