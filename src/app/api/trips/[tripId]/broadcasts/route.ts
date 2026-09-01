import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createBroadcastSchema } from "@/lib/validation/broadcast";
import type { Broadcast } from "@/types/broadcast";

/** 規格書 §5.4:總領隊/師父對此行程所有領隊廣播訊息,一般車輛領隊只能讀不能發。 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const { message } = createBroadcastSchema.parse(await req.json());

    const db = getAdminDb();
    const ref = db.collection("trips").doc(params.tripId).collection("broadcasts").doc();
    const broadcast: Broadcast = {
      id: ref.id,
      tripId: params.tripId,
      message,
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: new Date().toISOString(),
    };
    await ref.set(broadcast);

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "trip.broadcast",
      tripId: params.tripId,
      targetType: "broadcast",
      targetId: ref.id,
      detail: { message },
    });

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
