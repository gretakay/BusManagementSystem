import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireBusAccess, requireTripSuperLead, requireTripNotArchived } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleError";
import { getAdminDb } from "@/lib/firebase/admin";
import { encryptField, phoneLast4 } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { upsertPassengerSchema } from "@/lib/validation/passenger";
import { getBusGroupTag } from "@/types/role";
import type { Passenger, PassengerListItem } from "@/types/passenger";

function toListItem(p: Passenger): PassengerListItem {
  const { phoneEnc, emergencyContactPhoneEnc, ...rest } = p;
  return rest;
}

/**
 * 人員列表:superLead 可看全部;領隊/副領隊/小組長需帶 busId 且僅能查自己車輛。
 * leg=return 時依 returnBusId 篩選(回程可能換車),預設(或 leg=outbound)依 busId 篩選。
 * 若該領隊在這台車只負責特定組別(小客車車號等),再進一步只回傳該組別的人(小組長隱私隔離)。
 */
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    const busId = req.nextUrl.searchParams.get("busId");
    const leg = req.nextUrl.searchParams.get("leg") === "return" ? "return" : "outbound";
    const busField = leg === "return" ? "returnBusId" : "busId";

    const db = getAdminDb();
    const col = db.collection("trips").doc(params.tripId).collection("passengers");

    let query = col.orderBy("name");
    let groupTag: string | undefined;
    if (busId) {
      requireBusAccess(user, params.tripId, busId);
      groupTag = getBusGroupTag(user.role, params.tripId, busId);
      query = col.where(busField, "==", busId).orderBy("name") as typeof query;
    } else {
      requireTripSuperLead(user, params.tripId);
    }

    const snap = await query.get();
    let items = snap.docs.map((d) => toListItem(d.data() as Passenger));
    if (groupTag) items = items.filter((p) => p.busGroup === groupTag);
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

/** 單筆新增/更新(以報名序號 regNo 為比對鍵值,存在則更新、不存在則新增)。 */
export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const user = await requireUser(req);
    requireTripSuperLead(user, params.tripId);
    await requireTripNotArchived(params.tripId);

    const input = upsertPassengerSchema.parse(await req.json());
    const db = getAdminDb();
    const col = db.collection("trips").doc(params.tripId).collection("passengers");

    const existingSnap = await col.where("regNo", "==", input.regNo).limit(1).get();
    const now = new Date().toISOString();
    const ref = existingSnap.empty ? col.doc() : existingSnap.docs[0]!.ref;

    const passenger: Passenger = {
      id: ref.id,
      tripId: params.tripId,
      busId: input.busId ?? (existingSnap.empty ? null : (existingSnap.docs[0]!.data() as Passenger).busId),
      returnBusId:
        input.returnBusId ??
        (existingSnap.empty ? null : ((existingSnap.docs[0]!.data() as Passenger).returnBusId ?? null)),
      busGroup:
        input.busGroup ?? (existingSnap.empty ? "" : (existingSnap.docs[0]!.data() as Passenger).busGroup ?? ""),
      name: input.name,
      dharmaName: input.dharmaName ?? "",
      phoneEnc: encryptField(input.phone),
      phoneLast4: phoneLast4(input.phone),
      identity: input.identity,
      volunteerGroup: input.identity === "volunteer" ? input.volunteerGroup ?? "" : "",
      emergencyContactName: input.emergencyContactName ?? "",
      emergencyContactPhoneEnc: input.emergencyContactPhone
        ? encryptField(input.emergencyContactPhone)
        : "",
      regNo: input.regNo,
      lodgingInfo: input.lodgingInfo ?? "",
      createdAt: existingSnap.empty ? now : (existingSnap.docs[0]!.data() as Passenger).createdAt,
      updatedAt: now,
    };
    await ref.set(passenger);

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "passenger.upsert",
      tripId: params.tripId,
      targetType: "passenger",
      targetId: ref.id,
      detail: { regNo: input.regNo, created: existingSnap.empty },
    });

    return NextResponse.json(toListItem(passenger), { status: existingSnap.empty ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
