import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { updateBusSchema } from "@/lib/validation/bus";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string; busId: string } },
) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const input = updateBusSchema.parse(await req.json());
    const db = getAdminDb();
    const ref = db
      .collection("trips")
      .doc(params.tripId)
      .collection("buses")
      .doc(params.busId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "車輛不存在" }, { status: 404 });
    }

    await ref.update({ ...input });
    const updated = await ref.get();
    return NextResponse.json(updated.data());
  } catch (error) {
    return handleApiError(error);
  }
}
