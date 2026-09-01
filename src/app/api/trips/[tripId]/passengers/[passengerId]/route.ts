import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { reassignBusSchema } from "@/lib/validation/passenger";
import type { Passenger } from "@/types/passenger";

/** 排車「逐一調整」:變更單一人員所屬車次(superLead only),依 leg 決定改 busId(去程)或 returnBusId(回程)。 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string; passengerId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { leg, busId } = reassignBusSchema.parse(await req.json());
    const field = leg === "return" ? "returnBusId" : "busId";
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

    await ref.update({ [field]: busId, updatedAt: new Date().toISOString() });
    const updated = (await ref.get()).data() as Passenger;
    const { phoneEnc, emergencyContactPhoneEnc, ...listItem } = updated;
    return NextResponse.json(listItem);
  } catch (error) {
    return handleApiError(error);
  }
}
