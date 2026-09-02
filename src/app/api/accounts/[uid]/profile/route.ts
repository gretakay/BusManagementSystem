import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { updateAccountProfileSchema } from "@/lib/validation/account";

/** 設定/修改既有帳號的顯示名稱、登入手機號碼,僅全域總負責人可用。 */
export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { displayName, loginPhone } = updateAccountProfileSchema.parse(await req.json());

    const targetUser = await getAdminAuth()
      .getUser(params.uid)
      .catch(() => null);
    if (!targetUser) {
      return NextResponse.json({ error: "帳號不存在" }, { status: 404 });
    }

    const db = getAdminDb();
    if (loginPhone) {
      const dup = await db.collection("roles").where("loginPhone", "==", loginPhone).limit(1).get();
      if (dup.docs.some((d) => d.id !== params.uid)) {
        return NextResponse.json({ error: `手機號碼 ${loginPhone} 已被其他帳號使用` }, { status: 409 });
      }
    }

    await db
      .collection("roles")
      .doc(params.uid)
      .set(
        {
          email: targetUser.email ?? null,
          displayName: displayName || FieldValue.delete(),
          loginPhone: loginPhone || FieldValue.delete(),
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
