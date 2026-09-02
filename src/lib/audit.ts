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
  // detail 常常是呼叫端直接把選填欄位(例如 groupTag)丟進來,值可能是 undefined;
  // Firestore Admin SDK 預設不允許欄位值是 undefined,所以這裡先濾掉,避免呼叫端要一一手動處理。
  const detail = entry.detail
    ? Object.fromEntries(Object.entries(entry.detail).filter(([, v]) => v !== undefined))
    : null;

  await getAdminDb().collection("auditLogs").add({
    actorUid: entry.actorUid,
    actorEmail: entry.actorEmail ?? null,
    action: entry.action,
    tripId: entry.tripId ?? null,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    detail,
    timestamp: new Date().toISOString(),
  });
}
