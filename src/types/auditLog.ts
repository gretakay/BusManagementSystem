export type AuditAction =
  | "trip.create"
  | "trip.delete"
  | "trip.archive"
  | "trip.unarchive"
  | "bus.create"
  | "bus.assignLeader"
  | "trip.assignSuperLead"
  | "account.create"
  | "account.delete"
  | "account.setGlobalSuperLead"
  | "user.resetPassword"
  | "passenger.import"
  | "passenger.upsert"
  | "passenger.bulkReassign"
  | "trip.broadcast"
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
