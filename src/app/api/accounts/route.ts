import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createAccountSchema } from "@/lib/validation/account";
import {
  globalSuperLeadLabel,
  isGroupLeaderOnlyAccount,
  type GlobalAccessLevel,
  type GlobalSuperLeadTitle,
  type UserRoleDoc,
} from "@/types/role";

export interface AccountListItem {
  uid: string;
  email: string | null;
  createdAt: string;
  globalSuperLead: boolean;
  globalSuperLeadTitle: GlobalSuperLeadTitle | null;
  globalAccessLevel: GlobalAccessLevel | null;
  displayName: string | null;
  loginPhone: string | null;
  /** 這個帳號在所有行程裡是否都只當過小組長,供帳號管理頁面分頁顯示用(見 isGroupLeaderOnlyAccount)。 */
  isGroupLeaderOnly: boolean;
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
    const rolesByUid = new Map<string, UserRoleDoc>();
    for (const d of rolesSnap.docs) rolesByUid.set(d.id, d.data() as UserRoleDoc);

    const accounts: AccountListItem[] = authUsers.map((u) => {
      const roleDoc = rolesByUid.get(u.uid);
      return {
        ...u,
        globalSuperLead: Boolean(roleDoc?.globalSuperLead),
        globalSuperLeadTitle: roleDoc?.globalSuperLead ? globalSuperLeadLabel(roleDoc) : null,
        globalAccessLevel: roleDoc?.globalSuperLead ? (roleDoc.globalAccessLevel ?? "full") : null,
        displayName: roleDoc?.displayName ?? null,
        loginPhone: roleDoc?.loginPhone ?? null,
        isGroupLeaderOnly: isGroupLeaderOnlyAccount(roleDoc),
      };
    });

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
    const { email, password, displayName, loginPhone } = createAccountSchema.parse(await req.json());

    const auth = getAdminAuth();
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return NextResponse.json({ error: `email 為 ${email} 的帳號已存在` }, { status: 409 });
    }

    const db = getAdminDb();
    if (loginPhone) {
      const dup = await db.collection("roles").where("loginPhone", "==", loginPhone).limit(1).get();
      if (!dup.empty) {
        return NextResponse.json({ error: `手機號碼 ${loginPhone} 已被其他帳號使用` }, { status: 409 });
      }
    }

    const created = await auth.createUser({ email, password });

    if (displayName || loginPhone) {
      await db.collection("roles").doc(created.uid).set(
        {
          email,
          ...(displayName ? { displayName } : {}),
          ...(loginPhone ? { loginPhone } : {}),
        },
        { merge: true },
      );
    }

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "account.create",
      targetType: "user",
      targetId: created.uid,
      detail: { email, displayName, loginPhone },
    });

    const account: AccountListItem = {
      uid: created.uid,
      email: created.email ?? email,
      createdAt: created.metadata.creationTime,
      globalSuperLead: false,
      globalSuperLeadTitle: null,
      globalAccessLevel: null,
      displayName: displayName ?? null,
      loginPhone: loginPhone ?? null,
      isGroupLeaderOnly: false,
    };
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
