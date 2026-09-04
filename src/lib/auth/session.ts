import "server-only";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { UserRoleDoc } from "@/types/role";
import { isTripSuperLead, canAccessBus, hasGlobalFullAccess } from "@/types/role";

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
export class ConflictError extends Error {
  status = 409;
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
  if (!hasGlobalFullAccess(user.role)) {
    throw new ForbiddenError("僅總負責人可執行此操作(唯讀身分無法執行)");
  }
}

export function requireTripSuperLead(user: AuthedUser, tripId: string): void {
  if (!isTripSuperLead(user.role, tripId)) {
    throw new ForbiddenError("僅總領隊/師父可執行此操作(唯讀身分無法執行)");
  }
}

export function requireBusAccess(user: AuthedUser, tripId: string, busId: string): void {
  if (!canAccessBus(user.role, tripId, busId)) {
    throw new ForbiddenError("無此車輛存取權限");
  }
}

/**
 * 行程封存後,乘客/車輛資料應視為歷史紀錄凍結(呼應 rollcalls 規則在封存後禁止寫入的精神),
 * 寫入類 API 一律先呼叫這個檢查,避免封存後名單被悄悄改動而事後對帳兜不起來。
 */
export async function requireTripNotArchived(tripId: string): Promise<void> {
  const snap = await getAdminDb().collection("trips").doc(tripId).get();
  if (snap.data()?.status === "archived") {
    throw new ConflictError("行程已封存,無法修改此行程的資料");
  }
}

/**
 * 指派角色時查找對方帳號。帳號一律先在「帳號管理」建立,這裡不再順便建立新帳號,
 * 找不到就回傳 null,由呼叫端提示去帳號管理先建立。
 */
export async function findUserByEmail(email: string): Promise<{ uid: string; email: string | null } | null> {
  const existing = await getAdminAuth()
    .getUserByEmail(email)
    .catch(() => null);
  return existing ? { uid: existing.uid, email: existing.email ?? null } : null;
}
