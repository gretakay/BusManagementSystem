import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

const setGlobalSuperLeadSchema = z.object({
  globalSuperLead: z.boolean(),
});

/**
 * 授予/收回全域總負責人權限,僅全域總負責人可操作。
 * 禁止對自己收回權限,避免系統裡沒有任何全域總負責人可用(目前沒有其他管道能重新授予,只能靠後端腳本補救)。
 */
export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { globalSuperLead } = setGlobalSuperLeadSchema.parse(await req.json());

    if (!globalSuperLead && params.uid === user.uid) {
      return NextResponse.json({ error: "無法收回自己的全域總負責人權限" }, { status: 409 });
    }

    const auth = getAdminAuth();
    const targetUser = await auth.getUser(params.uid).catch(() => null);
    if (!targetUser) {
      return NextResponse.json({ error: "帳號不存在" }, { status: 404 });
    }

    await getAdminDb()
      .collection("roles")
      .doc(params.uid)
      .set({ email: targetUser.email ?? null, globalSuperLead }, { merge: true });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.setGlobalSuperLead",
      targetType: "user",
      targetId: params.uid,
      detail: { email: targetUser.email, globalSuperLead },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
