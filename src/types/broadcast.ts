/**
 * Phase 2 功能(規格書 §5.4 廣播訊息):目前僅定義型別與 Firestore 集合位置,
 * 尚未實作 UI 與 API route。
 */
export interface Broadcast {
  id: string;
  tripId: string;
  message: string;
  createdBy: string;
  createdAt: string;
}
