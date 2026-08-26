import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import type { AuditAction } from "@/types/auditLog";

export async function writeAuditLog(entry: {
  actorUid: string;
  actorEmail?: string | null;
  action: AuditAction;
  tripId?: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await getAdminDb().collection("auditLogs").add({
    actorUid: entry.actorUid,
    actorEmail: entry.actorEmail ?? null,
    action: entry.action,
    tripId: entry.tripId ?? null,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    detail: entry.detail ?? null,
    timestamp: new Date().toISOString(),
  });
}
