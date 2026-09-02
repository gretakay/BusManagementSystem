"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AuditAction, AuditLog } from "@/types/auditLog";

const ACTION_LABELS: Record<AuditAction, string> = {
  "trip.create": "建立行程",
  "trip.delete": "刪除行程",
  "trip.archive": "封存行程",
  "trip.unarchive": "解除封存",
  "bus.create": "新增車輛",
  "bus.assignLeader": "指派車輛領隊",
  "trip.assignSuperLead": "指派行程總領隊",
  "account.create": "建立帳號",
  "account.setGlobalSuperLead": "設定全域總負責人",
  "user.resetPassword": "重設密碼",
  "passenger.import": "批次匯入人員",
  "passenger.upsert": "新增/更新人員",
  "passenger.bulkReassign": "批次調整車次",
  "trip.broadcast": "發送廣播",
  "rollcall.create": "建立點名場次",
};

const PAGE_SIZE = 100;

export default function AuditLogPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripIdFilter, setTripIdFilter] = useState("");

  useEffect(() => {
    if (!role?.globalSuperLead) return;
    setLoading(true);
    const base = collection(getDb(), "auditLogs");
    const q = tripIdFilter.trim()
      ? query(base, where("tripId", "==", tripIdFilter.trim()), orderBy("timestamp", "desc"), limit(PAGE_SIZE))
      : query(base, orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ ...(d.data() as AuditLog), id: d.id })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [role?.globalSuperLead, tripIdFilter]);

  if (!role?.globalSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限查看操作紀錄。</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">操作紀錄</h1>
      <p className="text-sm text-gray-500">
        系統重要操作(建立/刪除行程、指派領隊、重設密碼等)的紀錄,最新 {PAGE_SIZE} 筆。
      </p>

      <input
        placeholder="依行程 ID 篩選(選填,可從網址列複製)"
        value={tripIdFilter}
        onChange={(e) => setTripIdFilter(e.target.value)}
        className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-400">尚無紀錄。</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr>
                <th className="px-4 py-2">時間</th>
                <th className="px-4 py-2">操作人</th>
                <th className="px-4 py-2">動作</th>
                <th className="px-4 py-2">對象</th>
                <th className="px-4 py-2">詳情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                    {new Date(log.timestamp).toLocaleString("zh-TW", { hour12: false })}
                  </td>
                  <td className="px-4 py-2">{log.actorEmail ?? log.actorUid}</td>
                  <td className="px-4 py-2">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {log.targetType ?? ""}
                    {log.targetId ? ` ・ ${log.targetId}` : ""}
                  </td>
                  <td className="max-w-xs break-words px-4 py-2 text-xs text-gray-400">
                    {log.detail ? JSON.stringify(log.detail) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
