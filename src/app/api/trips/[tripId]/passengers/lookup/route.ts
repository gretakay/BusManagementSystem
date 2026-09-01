import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireBusAccess } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Bus } from "@/types/bus";
import type { Passenger } from "@/types/passenger";

export interface PassengerLookupResult {
  found: boolean;
  sameBus?: boolean;
  name?: string;
  busNumber?: string | null;
}

/**
 * QR 掃描找不到本車人員時,查這個報名序號是否屬於「別台車」而非真的查無此人,
 * 讓領隊能直接顯示「此人員屬於 X 號車」而不是籠統的找不到。
 * 呼叫者需帶自己有權限的 busId 做權限檢查(避免車輛領隊繞過範圍查詢全行程名單)。
 */
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    const regNo = req.nextUrl.searchParams.get("regNo")?.trim();
    const callerBusId = req.nextUrl.searchParams.get("busId")?.trim();
    if (!regNo || !callerBusId) {
      return NextResponse.json({ error: "缺少 regNo 或 busId" }, { status: 400 });
    }
    requireBusAccess(user, params.tripId, callerBusId);

    const db = getAdminDb();
    const snap = await db
      .collection("trips")
      .doc(params.tripId)
      .collection("passengers")
      .where("regNo", "==", regNo)
      .limit(1)
      .get();

    if (snap.empty) {
      const result: PassengerLookupResult = { found: false };
      return NextResponse.json(result);
    }

    const passenger = snap.docs[0]!.data() as Passenger;
    if (passenger.busId === callerBusId) {
      const result: PassengerLookupResult = { found: true, sameBus: true, name: passenger.name };
      return NextResponse.json(result);
    }

    let busNumber: string | null = null;
    if (passenger.busId) {
      const busSnap = await db
        .collection("trips")
        .doc(params.tripId)
        .collection("buses")
        .doc(passenger.busId)
        .get();
      busNumber = busSnap.exists ? (busSnap.data() as Bus).busNumber : null;
    }

    const result: PassengerLookupResult = {
      found: true,
      sameBus: false,
      name: passenger.name,
      busNumber,
    };
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
