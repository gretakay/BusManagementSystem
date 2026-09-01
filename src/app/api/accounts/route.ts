import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createAccountSchema } from "@/lib/validation/account";
import type { UserRoleDoc } from "@/types/role";

export interface AccountListItem {
  uid: string;
  email: string | null;
  createdAt: string;
  globalSuperLead: boolean;
}

/** 帳號管理:不綁定特定行程,獨立建立/列出登入帳號,僅全域總負責人可用。 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);

    const auth = getAdminAuth();
    const authUsers: { uid: string; email: string | null; createdAt: string }[] = [];
    let pageToken: string | undefined;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const u of result.users) {
        authUsers.push({ uid: u.uid, email: u.email ?? null, createdAt: u.metadata.creationTime });
      }
      pageToken = result.pageToken || undefined;
    } while (pageToken);

    const rolesSnap = await getAdminDb().collection("roles").get();
    const globalSuperLeadUids = new Set(
      rolesSnap.docs.filter((d) => (d.data() as UserRoleDoc).globalSuperLead).map((d) => d.id),
    );

    const accounts: AccountListItem[] = authUsers.map((u) => ({
      ...u,
      globalSuperLead: globalSuperLeadUids.has(u.uid),
    }));

    accounts.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
    return NextResponse.json(accounts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);
    const { email, password } = createAccountSchema.parse(await req.json());

    const auth = getAdminAuth();
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return NextResponse.json({ error: `email 為 ${email} 的帳號已存在` }, { status: 409 });
    }
    const created = await auth.createUser({ email, password });

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.create",
      targetType: "user",
      targetId: created.uid,
      detail: { email },
    });

    const account: AccountListItem = {
      uid: created.uid,
      email: created.email ?? email,
      createdAt: created.metadata.creationTime,
      globalSuperLead: false,
    };
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
