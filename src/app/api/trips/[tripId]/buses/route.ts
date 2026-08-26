import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTripSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createBusSchema } from "@/lib/validation/bus";
import type { Bus } from "@/types/bus";

export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);

    const input = createBusSchema.parse(await req.json());
    const db = getAdminDb();

    const tripSnap = await db.collection("trips").doc(params.tripId).get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }
    if (tripSnap.data()?.status === "archived") {
      return NextResponse.json({ error: "行程已封存,無法新增車輛" }, { status: 409 });
    }

    const ref = db.collection("trips").doc(params.tripId).collection("buses").doc();
    const bus: Bus = {
      id: ref.id,
      tripId: params.tripId,
      busNumber: input.busNumber,
      driverName: input.driverName ?? "",
      driverPhone: input.driverPhone ?? "",
      seatCapacity: input.seatCapacity,
      leaders: [],
      createdAt: new Date().toISOString(),
    };
    await ref.set(bus);

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "bus.create",
      tripId: params.tripId,
      targetType: "bus",
      targetId: ref.id,
      detail: { busNumber: input.busNumber, seatCapacity: input.seatCapacity },
    });

    return NextResponse.json(bus, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
