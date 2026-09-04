/**
 * 角色權限來源:Firestore `roles/{uid}` 文件。
 * 不用 Firebase Auth custom claims,是因為排車/領隊指派可能在活動前臨時異動,
 * 若用 custom claims 每次異動都要使用者重新登入才會生效,體驗不佳。
 */

export type BusRole = "leader" | "coLeader" | "groupLeader";

/** 全域總負責人的顯示頭銜,純粹是給不同身分的人看的稱呼(例如朝山共修的「法師」),跟下面的權限等級各自獨立。 */
export type GlobalSuperLeadTitle = "總負責人" | "法師";

/** 全域總負責人的權限等級:full = 完整管理(預設,含舊資料),readOnly = 只能檢視所有行程,不能新增/編輯/刪除/指派/點名。 */
export type GlobalAccessLevel = "full" | "readOnly";

export interface BusRoleAssignment {
  role: BusRole;
  /** 只負責/只看得到該車內這個組別的人(例如小客車車號);未設定則整台車都看得到,維持原本行為 */
  groupTag?: string;
}

export interface TripRoleAssignment {
  /** 該使用者在此行程是否為總領隊/師父(可看全部車輛) */
  superLead: boolean;
  /** 該使用者在此行程內,擔任領隊/副領隊/小組長的車輛 ID 清單 */
  busRoles: Record<string, BusRoleAssignment>;
}

export interface UserRoleDoc {
  /** 全域總領隊/師父,對所有行程皆有 superLead 權限(供固定總負責人使用) */
  globalSuperLead?: boolean;
  /** globalSuperLead 為 true 時的顯示頭銜,未設定時預設「總負責人」 */
  globalSuperLeadTitle?: GlobalSuperLeadTitle;
  /** globalSuperLead 為 true 時的權限等級,未設定時視為 "full"(相容舊資料) */
  globalAccessLevel?: GlobalAccessLevel;
  displayName?: string;
  email?: string;
  /** 登入用手機號碼(選填),登入頁可以打這個代替 email;實際 Firebase Auth 帳號仍以 email 為準 */
  loginPhone?: string;
  trips: Record<string, TripRoleAssignment>;
}

export function globalSuperLeadLabel(role: UserRoleDoc | null | undefined): GlobalSuperLeadTitle {
  return role?.globalSuperLeadTitle ?? "總負責人";
}

/** 全域總負責人/法師是否為完整管理權限(非唯讀);globalSuperLead 為 false 時一律回傳 false。 */
export function hasGlobalFullAccess(role: UserRoleDoc | null | undefined): boolean {
  return Boolean(role?.globalSuperLead) && (role?.globalAccessLevel ?? "full") !== "readOnly";
}

export function isGlobalReadOnly(role: UserRoleDoc | null | undefined): boolean {
  return Boolean(role?.globalSuperLead) && role?.globalAccessLevel === "readOnly";
}

/** 是否可「管理」此行程(指派領隊、編輯、點名、廣播等寫入操作);全域唯讀法師不算,只能檢視。 */
export function isTripSuperLead(role: UserRoleDoc | null | undefined, tripId: string): boolean {
  if (!role) return false;
  if (hasGlobalFullAccess(role)) return true;
  return Boolean(role.trips?.[tripId]?.superLead);
}

/** 是否可「檢視」此行程全部資料(所有車輛/人員/點名進度);全域唯讀法師也算,只是不能寫入。 */
export function hasTripVisibility(role: UserRoleDoc | null | undefined, tripId: string): boolean {
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

/** 相容改版前的資料:busRoles 的值原本是純字串(BusRole),改版後是 { role, groupTag? } 物件。 */
export function normalizeBusRoleAssignment(
  raw: BusRoleAssignment | BusRole | undefined,
): BusRoleAssignment | undefined {
  if (raw == null) return undefined;
  return typeof raw === "string" ? { role: raw } : raw;
}

export function canAccessBus(
  role: UserRoleDoc | null | undefined,
  tripId: string,
  busId: string,
): boolean {
  if (hasTripVisibility(role, tripId)) return true;
  return getAssignedBusIds(role, tripId).includes(busId);
}

/**
 * 此使用者在該車是否只負責特定組別(例如小客車車號);回傳 undefined 表示整台車都看得到
 * (包含總領隊/師父,以及沒有設定組別的一般領隊/副領隊/小組長)。
 */
export function getBusGroupTag(
  role: UserRoleDoc | null | undefined,
  tripId: string,
  busId: string,
): string | undefined {
  if (hasTripVisibility(role, tripId)) return undefined;
  return normalizeBusRoleAssignment(role?.trips?.[tripId]?.busRoles?.[busId])?.groupTag;
}

/** 此使用者在該行程是否有任何指派(行程總領隊,或任一車輛的領隊/副領隊/小組長),供行程列表篩選用。 */
export function hasTripAssignment(role: UserRoleDoc | null | undefined, tripId: string): boolean {
  if (!role) return false;
  if (role.globalSuperLead) return true;
  const trip = role.trips?.[tripId];
  if (!trip) return false;
  return Boolean(trip.superLead) || Object.keys(trip.busRoles ?? {}).length > 0;
}

/**
 * 這個帳號在「所有」行程裡是否都只當過小組長(從來沒當過總領隊/領隊/副領隊、也不是全域總負責人)。
 * 小組長角色是按行程/按車輛個別指派、會隨行程變動,沒有固定不變的「帳號類型」可存,
 * 所以帳號管理頁面的分頁用這個即時算出來的結果分類,而不是在建立帳號時寫死一個標籤。
 */
export function isGroupLeaderOnlyAccount(role: UserRoleDoc | null | undefined): boolean {
  if (!role || role.globalSuperLead) return false;
  const trips = Object.values(role.trips ?? {});
  if (trips.length === 0) return false;
  let hasGroupLeaderRole = false;
  for (const trip of trips) {
    if (trip.superLead) return false;
    for (const raw of Object.values(trip.busRoles ?? {})) {
      const assignment = normalizeBusRoleAssignment(raw);
      if (!assignment) continue;
      if (assignment.role !== "groupLeader") return false;
      hasGroupLeaderRole = true;
    }
  }
  return hasGroupLeaderRole;
}

const BUS_ROLE_LABELS: Record<BusRole, string> = {
  leader: "領隊",
  coLeader: "副領隊",
  groupLeader: "小組長",
};

/** 在行程列表等地方顯示「你的身分」摘要,不含車輛名稱(需要車輛名稱時另外用 busRoles 查對照)。 */
export function tripRoleSummary(role: UserRoleDoc | null | undefined, tripId: string): string | null {
  if (!role) return null;
  if (role.globalSuperLead) {
    return `${globalSuperLeadLabel(role)}(全域${isGlobalReadOnly(role) ? "・唯讀" : ""})`;
  }
  const trip = role.trips?.[tripId];
  if (!trip) return null;
  if (trip.superLead) return "此行程總領隊";
  const assignments = Object.values(trip.busRoles ?? {})
    .map(normalizeBusRoleAssignment)
    .filter((a): a is BusRoleAssignment => a != null);
  if (assignments.length === 0) return null;
  const roles = Array.from(new Set(assignments.map((a) => a.role)));
  return roles.map((r) => BUS_ROLE_LABELS[r]).join("、");
}
