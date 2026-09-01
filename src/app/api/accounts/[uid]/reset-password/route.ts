import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { resetAccountPasswordSchema } from "@/lib/validation/account";

/** 全域總負責人直接重設任一帳號的密碼,不限定該帳號是否已加入某個行程。 */
export async function POST(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { password } = resetAccountPasswordSchema.parse(await req.json());

    await getAdminAuth().updateUser(params.uid, { password });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "user.resetPassword",
      targetType: "user",
      targetId: params.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
