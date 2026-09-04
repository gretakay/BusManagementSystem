import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireGlobalSuperLead } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { createTripSchema } from "@/lib/validation/trip";
import { hasTripAssignment } from "@/types/role";
import type { Trip } from "@/types/trip";
import type { Bus } from "@/types/bus";

/**
 * 行程列表不能直接用 client Firestore 查詢:trips 的權限規則需要讀 roles/{uid} 才能判斷,
 * 而 Firestore 對沒有 where 條件、規則又依賴其他文件的 list query 是整包拒絕(不是逐筆過濾),
 * 只要 collection 裡有一筆不屬於自己的行程,整個查詢就會 permission-denied。
 * 所以改成後端(Admin SDK 不受 rules 限制)依 hasTripAssignment 邏輯過濾後回傳。
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const snap = await getAdminDb().collection("trips").orderBy("date", "desc").get();
    const trips = snap.docs
      .map((d) => d.data() as Trip)
      .filter((trip) => hasTripAssignment(user.role, trip.id));
    return NextResponse.json(trips);
  } catch (error) {
    return handleApiError(error);
  }
}

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
      plannedSessions: { outbound: [], return: [] },
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
