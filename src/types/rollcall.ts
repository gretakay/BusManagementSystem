export type AttendanceStatus = "present" | "absent" | "leave";
export type AttendanceSource = "qr" | "manual";

export interface AttendanceRecord {
  status: AttendanceStatus;
  source: AttendanceSource;
  operatorUid: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * 一份點名文件對應「一個場次 + 一台車」,records 為 passengerId -> 狀態的 map。
 * 這樣總領隊儀表板監聽少量文件即可算出全車輛完成度,同時 40 人內遠低於 1MB 上限。
 */
export interface RollCall {
  id: string;
  tripId: string;
  busId: string;
  /** 場次名稱,可自訂,例如「去程上車」「午餐後」「返程前」 */
  sessionName: string;
  createdAt: string;
  createdBy: string;
  records: Record<string, AttendanceRecord>;
}

export interface CreateRollCallInput {
  busId: string;
  sessionName: string;
}

export interface MarkAttendanceInput {
  passengerId: string;
  status: AttendanceStatus;
  source: AttendanceSource;
}
