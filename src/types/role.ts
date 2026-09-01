/**
 * 角色權限來源:Firestore `roles/{uid}` 文件。
 * 不用 Firebase Auth custom claims,是因為排車/領隊指派可能在活動前臨時異動,
 * 若用 custom claims 每次異動都要使用者重新登入才會生效,體驗不佳。
 */

export type BusRole = "leader" | "coLeader" | "groupLeader";

/** 全域總負責人的顯示頭銜,權限完全相同,純粹是給不同身分的人看的稱呼(例如朝山共修的「法師」)。 */
export type GlobalSuperLeadTitle = "總負責人" | "法師";

export interface TripRoleAssignment {
  /** 該使用者在此行程是否為總領隊/師父(可看全部車輛) */
  superLead: boolean;
  /** 該使用者在此行程內,擔任領隊/副領隊/小組長的車輛 ID 清單 */
  busRoles: Record<string, BusRole>;
}

export interface UserRoleDoc {
  /** 全域總領隊/師父,對所有行程皆有 superLead 權限(供固定總負責人使用) */
  globalSuperLead?: boolean;
  /** globalSuperLead 為 true 時的顯示頭銜,未設定時預設「總負責人」 */
  globalSuperLeadTitle?: GlobalSuperLeadTitle;
  displayName?: string;
  email?: string;
  trips: Record<string, TripRoleAssignment>;
}

export function globalSuperLeadLabel(role: UserRoleDoc | null | undefined): GlobalSuperLeadTitle {
  return role?.globalSuperLeadTitle ?? "總負責人";
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

/** 此使用者在該行程是否有任何指派(行程總領隊,或任一車輛的領隊/副領隊/小組長),供行程列表篩選用。 */
export function hasTripAssignment(role: UserRoleDoc | null | undefined, tripId: string): boolean {
  if (!role) return false;
  if (role.globalSuperLead) return true;
  const trip = role.trips?.[tripId];
  if (!trip) return false;
  return Boolean(trip.superLead) || Object.keys(trip.busRoles ?? {}).length > 0;
}

const BUS_ROLE_LABELS: Record<BusRole, string> = {
  leader: "領隊",
  coLeader: "副領隊",
  groupLeader: "小組長",
};

/** 在行程列表等地方顯示「你的身分」摘要,不含車輛名稱(需要車輛名稱時另外用 busRoles 查對照)。 */
export function tripRoleSummary(role: UserRoleDoc | null | undefined, tripId: string): string | null {
  if (!role) return null;
  if (role.globalSuperLead) return `${globalSuperLeadLabel(role)}(全域)`;
  const trip = role.trips?.[tripId];
  if (!trip) return null;
  if (trip.superLead) return "此行程總領隊";
  const roles = Array.from(new Set(Object.values(trip.busRoles ?? {})));
  if (roles.length === 0) return null;
  return roles.map((r) => BUS_ROLE_LABELS[r]).join("、");
}
