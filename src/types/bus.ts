import type { BusRole } from "./role";

export interface Bus {
  id: string;
  tripId: string;
  busNumber: string;
  driverName?: string;
  driverPhone?: string;
  /** 座位上限,用於排車超載提示 */
  seatCapacity: number;
  /** 領隊/副領隊/小組長,以 email 顯示、實際權限寫在 roles/{uid} */
  leaders: BusLeaderAssignment[];
  createdAt: string;
}

export interface BusLeaderAssignment {
  uid: string;
  email: string;
  role: BusRole;
  /** 只負責這個組別(例如小客車車號);留空表示整台車都看得到 */
  groupTag?: string;
}

export interface CreateBusInput {
  busNumber: string;
  driverName?: string;
  driverPhone?: string;
  seatCapacity: number;
}

export interface AssignBusLeaderInput {
  email: string;
  role: BusRole;
  groupTag?: string;
}
