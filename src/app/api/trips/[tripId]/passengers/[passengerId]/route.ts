import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { reassignBusSchema } from "@/lib/validation/passenger";
import type { Passenger } from "@/types/passenger";

/**
 * 排車「逐一調整」:變更單一人員所屬車次(依 leg 決定改 busId 去程或 returnBusId 回程)
 * 及/或車內組別(busGroup,例如小客車車號)。superLead only。
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string; passengerId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { leg, busId, busGroup } = reassignBusSchema.parse(await req.json());
    const db = getAdminDb();
    const ref = db
      .collection("trips")
      .doc(params.tripId)
      .collection("passengers")
      .doc(params.passengerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "人員不存在" }, { status: 404 });
    }
    const existing = snap.data() as Passenger;

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (leg && busId !== undefined) {
      if (leg === "return") {
        update.returnBusId = busId;
      } else {
        update.busId = busId;
        // 回程若還沒被明確設定過,預設跟去程同一台車;一旦手動改過回程,之後改去程就不會再覆蓋。
        if (existing.returnBusId == null) update.returnBusId = busId;
      }
    }
    if (busGroup !== undefined) update.busGroup = busGroup || "";

    await ref.update(update);
    const updated = (await ref.get()).data() as Passenger;
    const { phoneEnc, emergencyContactPhoneEnc, ...listItem } = updated;
    return NextResponse.json(listItem);
  } catch (error) {
    return handleApiError(error);
  }
}
