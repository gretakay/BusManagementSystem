import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { updateTripSchema } from "@/lib/validation/trip";

export async function PATCH(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const input = updateTripSchema.parse(await req.json());
    const db = getAdminDb();
    const ref = db.collection("trips").doc(params.tripId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }
    if (snap.data()?.status === "archived") {
      return NextResponse.json({ error: "行程已封存,請先解除封存後再編輯" }, { status: 409 });
    }

    await ref.update({ ...input });
    const updated = await ref.get();
    return NextResponse.json(updated.data());
  } catch (error) {
    return handleApiError(error);
  }
}
