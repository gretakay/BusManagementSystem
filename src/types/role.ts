/**
 * 角色權限來源:Firestore `roles/{uid}` 文件。
 * 不用 Firebase Auth custom claims,是因為排車/領隊指派可能在活動前臨時異動,
 * 若用 custom claims 每次異動都要使用者重新登入才會生效,體驗不佳。
 */

export type BusRole = "leader" | "coLeader" | "groupLeader";

export interface TripRoleAssignment {
  /** 該使用者在此行程是否為總領隊/師父(可看全部車輛) */
  superLead: boolean;
  /** 該使用者在此行程內,擔任領隊/副領隊/小組長的車輛 ID 清單 */
  busRoles: Record<string, BusRole>;
}

export interface UserRoleDoc {
  /** 全域總領隊/師父,對所有行程皆有 superLead 權限(供固定總負責人使用) */
  globalSuperLead?: boolean;
  displayName?: string;
  email?: string;
  trips: Record<string, TripRoleAssignment>;
}

export function isTripSuperLead(role: UserRoleDoc | null | undefined, tripId: string): boolean {
  if (!role) return false;
  if (role.globalSuperLead) return true;
  return Boolean(role.trips?.[tripId]?.superLead);
}

export function getAssignedBusIds(role: UserRoleDoc | null | undefined, tripId: string): string[] {
  if (!role) return [];
  const trip = role.trips?.[tripId];
  if (!trip) return [];
  return Object.keys(trip.busRoles ?? {});
}

export function canAccessBus(
  role: UserRoleDoc | null | undefined,
  tripId: string,
  busId: string,
): boolean {
  if (isTripSuperLead(role, tripId)) return true;
  return getAssignedBusIds(role, tripId).includes(busId);
}
