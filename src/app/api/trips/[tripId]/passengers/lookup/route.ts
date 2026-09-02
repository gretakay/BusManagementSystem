import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireBusAccess } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Bus } from "@/types/bus";
import type { Passenger } from "@/types/passenger";
import { getBusGroupTag } from "@/types/role";

export interface PassengerLookupResult {
  found: boolean;
  sameBus?: boolean;
  /** true 表示同車但不屬於呼叫者負責的組別(小組長情境),故意不回傳對方實際組別以維持隔離 */
  differentGroup?: boolean;
  name?: string;
  busNumber?: string | null;
}

/**
 * QR 掃描找不到本車(或本組)人員時,查這個報名序號是否屬於「別台車」或「同車別組」而非真的查無此人,
 * 讓領隊能直接顯示明確原因而不是籠統的找不到。
 * 呼叫者需帶自己有權限的 busId 做權限檢查(避免車輛領隊繞過範圍查詢全行程名單)。
 */
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    const regNo = req.nextUrl.searchParams.get("regNo")?.trim();
    const callerBusId = req.nextUrl.searchParams.get("busId")?.trim();
    const leg = req.nextUrl.searchParams.get("leg") === "return" ? "return" : "outbound";
    const busField = leg === "return" ? "returnBusId" : "busId";
    if (!regNo || !callerBusId) {
      return NextResponse.json({ error: "缺少 regNo 或 busId" }, { status: 400 });
    }
    requireBusAccess(user, params.tripId, callerBusId);
    const callerGroupTag = getBusGroupTag(user.role, params.tripId, callerBusId);

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
    const assignedBusId = busField === "returnBusId" ? passenger.returnBusId : passenger.busId;
    if (assignedBusId === callerBusId) {
      if (callerGroupTag && passenger.busGroup !== callerGroupTag) {
        const result: PassengerLookupResult = { found: true, sameBus: true, differentGroup: true };
        return NextResponse.json(result);
      }
      const result: PassengerLookupResult = { found: true, sameBus: true, name: passenger.name };
      return NextResponse.json(result);
    }

    let busNumber: string | null = null;
    if (assignedBusId) {
      const busSnap = await db
        .collection("trips")
        .doc(params.tripId)
        .collection("buses")
        .doc(assignedBusId)
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
