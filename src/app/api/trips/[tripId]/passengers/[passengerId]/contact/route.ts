import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireBusAccess, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { decryptField } from "@/lib/crypto";
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

    if (passenger.busId) {
      requireBusAccess(user, params.tripId, passenger.busId);
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
