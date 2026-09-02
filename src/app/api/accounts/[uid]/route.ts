import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

/**
 * 刪除帳號(Firebase Auth 使用者 + roles/{uid} 文件),僅全域總負責人可用。
 * 只用過一次的義工/領隊帳號可以在活動結束後清掉,避免帳號清單越積越長。
 * 過去行程的領隊指派紀錄(bus.leaders / trip.superLeads 的展開快照)不會跟著清除,
 * 純粹當作歷史紀錄保留;該帳號的登入權限本身已經隨 Auth 使用者一併移除。
 */
export async function DELETE(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);

    if (params.uid === user.uid) {
      return NextResponse.json({ error: "無法刪除自己的帳號" }, { status: 409 });
    }

    const auth = getAdminAuth();
    const targetUser = await auth.getUser(params.uid).catch(() => null);
    if (!targetUser) {
      return NextResponse.json({ error: "帳號不存在" }, { status: 404 });
    }

    await auth.deleteUser(params.uid);
    await getAdminDb().collection("roles").doc(params.uid).delete();

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.delete",
      targetType: "user",
      targetId: params.uid,
      detail: { email: targetUser.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
