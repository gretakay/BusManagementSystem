import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

const setGlobalSuperLeadSchema = z.object({
  globalSuperLead: z.boolean(),
  /** globalSuperLead 為 true 時的顯示頭銜,權限完全相同,純粹是給不同身分的人看的稱呼。省略時預設「總負責人」。 */
  title: z.enum(["總負責人", "法師"]).optional(),
});

/**
 * 授予/收回全域總負責人權限(可選擇顯示頭銜「總負責人」或「法師」,權限一致),僅全域總負責人可操作。
 * 禁止對自己收回權限,避免系統裡沒有任何全域總負責人可用(目前沒有其他管道能重新授予,只能靠後端腳本補救)。
 */
export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { globalSuperLead, title } = setGlobalSuperLeadSchema.parse(await req.json());

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
      .set(
        {
          email: targetUser.email ?? null,
          globalSuperLead,
          globalSuperLeadTitle: globalSuperLead ? (title ?? "總負責人") : FieldValue.delete(),
        },
        { merge: true },
      );

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.setGlobalSuperLead",
      targetType: "user",
      targetId: params.uid,
      detail: { email: targetUser.email, globalSuperLead, title },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
