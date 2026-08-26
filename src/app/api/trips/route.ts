import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createTripSchema } from "@/lib/validation/trip";
import type { Trip } from "@/types/trip";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    requireGlobalSuperLead(user);

    const input = createTripSchema.parse(await req.json());
    const now = new Date().toISOString();

    const db = getAdminDb();
    const ref = db.collection("trips").doc();
    const trip: Trip = {
      id: ref.id,
      name: input.name,
      date: input.date,
      busCount: input.busCount,
      status: "notStarted",
      archivedAt: null,
      createdAt: now,
      createdBy: user.uid,
      superLeads: [],
      plannedSessions: [],
    };
    await ref.set(trip);

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "trip.create",
      tripId: ref.id,
      targetType: "trip",
      targetId: ref.id,
      detail: { name: input.name, date: input.date, busCount: input.busCount },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
