export type TripStatus = "notStarted" | "inProgress" | "ended" | "archived";

export interface Trip {
  id: string;
  name: string;
  /** 活動日期,ISO 8601 date string(YYYY-MM-DD) */
  date: string;
  busCount: number;
  status: TripStatus;
  /** 封存時間戳記(轉為 archived 當下),ISO string */
  archivedAt?: string | null;
  createdAt: string;
  createdBy: string;
  /** 此行程的總領隊(非全域總負責人),以 email 顯示、實際權限寫在 roles/{uid} */
  superLeads: TripSuperLeadAssignment[];
  /** 總領隊預先規劃的點名場次名稱清單,各車點名頁依此清單一鍵開場次,確保全車輛場次名稱一致 */
  plannedSessions: string[];
}

export interface TripSuperLeadAssignment {
  uid: string;
  email: string;
}

export interface CreateTripInput {
  name: string;
  date: string;
  busCount: number;
}
