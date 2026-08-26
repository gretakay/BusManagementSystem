import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Passenger } from "@/types/passenger";

const reassignBusSchema = z.object({
  busId: z.string().trim().nullable(),
});

/** 排車「逐一調整」:變更單一人員所屬車次(superLead only)。 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string; passengerId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { busId } = reassignBusSchema.parse(await req.json());
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

    await ref.update({ busId, updatedAt: new Date().toISOString() });
    const updated = (await ref.get()).data() as Passenger;
    const { phoneEnc, emergencyContactPhoneEnc, ...listItem } = updated;
    return NextResponse.json(listItem);
  } catch (error) {
    return handleApiError(error);
  }
}
