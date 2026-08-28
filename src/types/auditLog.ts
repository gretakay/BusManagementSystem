export type AuditAction =
  | "trip.create"
  | "trip.archive"
  | "trip.unarchive"
  | "bus.create"
  | "bus.assignLeader"
  | "trip.assignSuperLead"
  | "user.resetPassword"
  | "passenger.import"
  | "passenger.upsert"
  | "rollcall.create";

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail?: string;
  action: AuditAction;
  tripId?: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  timestamp: string;
}
