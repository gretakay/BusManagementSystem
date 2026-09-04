import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { decryptField } from "@/lib/crypto";
import type { Passenger, PassengerExportItem } from "@/types/passenger";

/**
 * 「點名報表」匯出專用:總領隊才能拿到解密後的完整電話。
 * 一般名單 API(passengers/route.ts)只回傳末四碼,避免電話明碼在畫面上不必要地流通;
 * 但這份報表本身就是給領隊離線時當紙本備援用的,少了完整電話就無法真的打電話聯絡未到人員。
 */
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const db = getAdminDb();
    const snap = await db
      .collection("trips")
      .doc(params.tripId)
      .collection("passengers")
      .orderBy("name")
      .get();

    const items: PassengerExportItem[] = snap.docs.map((d) => {
      const p = d.data() as Passenger;
      const { phoneEnc, emergencyContactPhoneEnc, ...rest } = p;
      return {
        ...rest,
        phone: phoneEnc ? decryptField(phoneEnc) : null,
        emergencyContactPhone: emergencyContactPhoneEnc ? decryptField(emergencyContactPhoneEnc) : null,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}
