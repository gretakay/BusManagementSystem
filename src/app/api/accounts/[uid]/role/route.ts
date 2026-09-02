import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";

const setGlobalSuperLeadSchema = z.object({
  globalSuperLead: z.boolean(),
  /** globalSuperLead 為 true 時的顯示頭銜,純粹是給不同身分的人看的稱呼,跟權限高低脫鉤。省略時預設「總負責人」。 */
  title: z.enum(["總負責人", "法師"]).optional(),
  /** globalSuperLead 為 true 時的權限等級:完整管理(預設)或唯讀。跟上面的頭銜各自獨立選擇。 */
  accessLevel: z.enum(["full", "readOnly"]).optional(),
});

/**
 * 授予/收回全域總負責人權限(顯示頭銜「總負責人」或「法師」、權限等級「完整管理」或「唯讀」,兩者各自獨立設定),僅全域總負責人可操作。
 * 禁止對自己收回權限或降為唯讀,避免系統裡沒有任何全域完整管理權限的帳號可用(目前沒有其他管道能重新授予,只能靠後端腳本補救)。
 */
export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { globalSuperLead, title, accessLevel } = setGlobalSuperLeadSchema.parse(await req.json());

    if (!globalSuperLead && params.uid === user.uid) {
      return NextResponse.json({ error: "無法收回自己的全域總負責人權限" }, { status: 409 });
    }
    if (globalSuperLead && accessLevel === "readOnly" && params.uid === user.uid) {
      return NextResponse.json({ error: "無法把自己的權限降為唯讀" }, { status: 409 });
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
          globalAccessLevel: globalSuperLead ? (accessLevel ?? "full") : FieldValue.delete(),
        },
        { merge: true },
      );

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.setGlobalSuperLead",
      targetType: "user",
      targetId: params.uid,
      detail: { email: targetUser.email, globalSuperLead, title, accessLevel },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
