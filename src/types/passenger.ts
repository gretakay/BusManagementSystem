export type PassengerIdentity = "guest" | "believer" | "volunteer";

/**
 * 人員資料。phone / emergencyContactPhone 在資料庫中是加密字串,
 * 前端一般讀取的是 PassengerListItem(不含明碼電話),
 * 只有在需要撥號時才會另外呼叫 API 取得解密後的號碼。
 */
export interface Passenger {
  id: string;
  tripId: string;
  busId: string | null;
  name: string;
  dharmaName?: string;
  /** 加密後密文,不應直接顯示於畫面 */
  phoneEnc: string;
  /** 手機號碼後四碼,明碼存放供點名頁快速搜尋比對用(領隊/副領隊/小組長忘帶名單卡時) */
  phoneLast4: string;
  identity: PassengerIdentity;
  /** 僅 identity === 'volunteer' 時使用,自由輸入,依當場活動實際分組 */
  volunteerGroup?: string;
  emergencyContactName?: string;
  /** 加密後密文 */
  emergencyContactPhoneEnc?: string;
  /** 外部報名系統提供的序號,QR Code 比對鍵值,同一行程內唯一 */
  regNo: string;
  /** 寮房資訊(個人層級) */
  lodgingInfo?: string;
  createdAt: string;
  updatedAt: string;
}

/** 給列表/排車畫面用,不含加密欄位原文 */
export type PassengerListItem = Omit<Passenger, "phoneEnc" | "emergencyContactPhoneEnc">;

export interface PassengerContactInfo {
  phone: string | null;
  emergencyContactPhone: string | null;
}

export interface UpsertPassengerInput {
  regNo: string;
  name: string;
  dharmaName?: string;
  phone: string;
  identity: PassengerIdentity;
  volunteerGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  busId?: string | null;
  lodgingInfo?: string;
}

export interface ImportPassengersResult {
  createdCount: number;
  updatedCount: number;
  errors: { row: number; regNo?: string; message: string }[];
}
