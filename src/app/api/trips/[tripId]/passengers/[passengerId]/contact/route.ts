import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead, ForbiddenError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { decryptField } from "@/lib/crypto";
import { canAccessBus, getBusGroupTag } from "@/types/role";
import type { Passenger, PassengerContactInfo } from "@/types/passenger";

/**
 * 取得單一人員解密後的電話(供「一鍵撥打」使用)。
 * 電話明碼只在此次回應中出現,前端不應長期儲存/渲染成文字,只用於 tel: 連結。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string; passengerId: string } },
) {
  try {
    const user = await requireUser(req);
    const db = getAdminDb();
    const snap = await db
      .collection("trips")
      .doc(params.tripId)
      .collection("passengers")
      .doc(params.passengerId)
      .get();
    if (!snap.exists) {
      return NextResponse.json({ error: "人員不存在" }, { status: 404 });
    }
    const passenger = snap.data() as Passenger;

    // 去程/回程車次各自獨立,兩段都要檢查(否則只負責回程車的領隊查詢回程乘客電話會被誤擋);
    // 若是靠這台車的權限通過、而該領隊在這台車只負責特定組別,還要確認這位乘客屬於同一組,
    // 跟名單 API(passengers/route.ts)的「小組長隱私隔離」邏輯保持一致,避免電話號碼繞過組別限制外洩。
    const accessBusId =
      (passenger.busId && canAccessBus(user.role, params.tripId, passenger.busId) && passenger.busId) ||
      (passenger.returnBusId &&
        canAccessBus(user.role, params.tripId, passenger.returnBusId) &&
        passenger.returnBusId) ||
      null;

    if (accessBusId) {
      const groupTag = getBusGroupTag(user.role, params.tripId, accessBusId);
      if (groupTag && passenger.busGroup !== groupTag) {
        throw new ForbiddenError("此人員不屬於您負責的組別");
      }
    } else {
      requireTripSuperLead(user, params.tripId);
    }

    const info: PassengerContactInfo = {
      phone: passenger.phoneEnc ? decryptField(passenger.phoneEnc) : null,
      emergencyContactPhone: passenger.emergencyContactPhoneEnc
        ? decryptField(passenger.emergencyContactPhoneEnc)
        : null,
    };
    return NextResponse.json(info);
  } catch (error) {
    return handleApiError(error);
  }
}
