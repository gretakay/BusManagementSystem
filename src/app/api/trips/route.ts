import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createTripSchema } from "@/lib/validation/trip";
import type { Trip } from "@/types/trip";
import type { Bus } from "@/types/bus";

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

    const busBatch = db.batch();
    for (let i = 1; i <= input.busCount; i += 1) {
      const busRef = ref.collection("buses").doc();
      const bus: Bus = {
        id: busRef.id,
        tripId: ref.id,
        busNumber: `${i}號車`,
        driverName: "",
        driverPhone: "",
        seatCapacity: 40,
        leaders: [],
        createdAt: now,
      };
      busBatch.set(busRef, bus);
    }
    await busBatch.commit();

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
