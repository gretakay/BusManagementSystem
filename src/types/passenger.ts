export type PassengerIdentity = "guest" | "believer" | "volunteer";

/** 行程分兩段,去程/回程可能搭不同車(或其中一段自行開車、不搭乘遊覽車)。 */
export type TripLeg = "outbound" | "return";

/** busId / returnBusId 的特殊值:此人該段行程自行開車前往,不搭乘任何遊覽車。 */
export const SELF_ARRANGED = "__self__";

/**
 * 人員資料。phone / emergencyContactPhone 在資料庫中是加密字串,
 * 前端一般讀取的是 PassengerListItem(不含明碼電話),
 * 只有在需要撥號時才會另外呼叫 API 取得解密後的號碼。
 */
export interface Passenger {
  id: string;
  tripId: string;
  /** 去程車次;null 表示尚未分配,SELF_ARRANGED 表示自行開車 */
  busId: string | null;
  /** 回程車次,與 busId 各自獨立(預設也是 null,需另外分配,不會自動跟去程一樣) */
  returnBusId: string | null;
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
  returnBusId?: string | null;
  lodgingInfo?: string;
}

export interface ImportPassengersResult {
  createdCount: number;
  updatedCount: number;
  errors: { row: number; regNo?: string; message: string }[];
}
