/** 規格書 §5.4:總領隊/師父對所有領隊廣播訊息(例如集合地點異動、天候通知)。 */
export interface Broadcast {
  id: string;
  tripId: string;
  message: string;
  createdBy: string;
  createdByEmail?: string | null;
  createdAt: string;
}
