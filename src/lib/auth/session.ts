import "server-only";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { UserRoleDoc } from "@/types/role";
import { isTripSuperLead, canAccessBus } from "@/types/role";

export interface AuthedUser {
  uid: string;
  email: string | null;
  role: UserRoleDoc | null;
}

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

/** 驗證 API route 呼叫者的 Firebase ID token,並帶出其角色文件。 */
export async function requireUser(req: NextRequest): Promise<AuthedUser> {
  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new UnauthorizedError("缺少驗證 token");

  const decoded = await getAdminAuth().verifyIdToken(match[1]!).catch(() => {
    throw new UnauthorizedError("token 無效或已過期");
  });

  const roleSnap = await getAdminDb().collection("roles").doc(decoded.uid).get();
  const role = (roleSnap.exists ? (roleSnap.data() as UserRoleDoc) : null) ?? null;

  return { uid: decoded.uid, email: decoded.email ?? null, role };
}

export function requireGlobalSuperLead(user: AuthedUser): void {
  if (!user.role?.globalSuperLead) {
    throw new ForbiddenError("僅總負責人可執行此操作");
  }
}

export function requireTripSuperLead(user: AuthedUser, tripId: string): void {
  if (!isTripSuperLead(user.role, tripId)) {
    throw new ForbiddenError("僅總領隊/師父可執行此操作");
  }
}

export function requireBusAccess(user: AuthedUser, tripId: string, busId: string): void {
  if (!canAccessBus(user.role, tripId, busId)) {
    throw new ForbiddenError("無此車輛存取權限");
  }
}
