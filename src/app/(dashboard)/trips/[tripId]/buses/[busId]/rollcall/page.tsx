"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { apiFetch } from "@/lib/api/client";
import { QrScanner } from "@/components/rollcall/QrScanner";
import type { PassengerContactInfo, PassengerListItem } from "@/types/passenger";
import type { AttendanceStatus, RollCall } from "@/types/rollcall";
import type { Trip } from "@/types/trip";
import type { PassengerLookupResult } from "@/app/api/trips/[tripId]/passengers/lookup/route";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "已到",
  absent: "未到",
  leave: "請假",
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-600 text-white",
  absent: "bg-red-500 text-white",
  leave: "bg-amber-500 text-white",
};

export default function BusRollCallPage() {
  const { tripId, busId } = useParams<{ tripId: string; busId: string }>();
  const { user } = useAuth();
  const access = useTripAccess(tripId);

  const [roster, setRoster] = useState<PassengerListItem[]>([]);
  const [rollcalls, setRollcalls] = useState<RollCall[]>([]);
  const [plannedSessions, setPlannedSessions] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newSessionName, setNewSessionName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");
  const [scanning, setScanning] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [contactCache, setContactCache] = useState<Record<string, PassengerContactInfo>>({});
  const [qrFeedback, setQrFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const qrFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<PassengerListItem[]>(`/api/trips/${tripId}/passengers?busId=${busId}`)
      .then(setRoster)
      .catch(() => setRoster([]));
  }, [tripId, busId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(getDb(), "trips", tripId), (snap) => {
      if (snap.exists()) setPlannedSessions((snap.data() as Trip).plannedSessions ?? []);
    });
    return () => unsub();
  }, [tripId]);

  useEffect(() => {
    const q = query(
      collection(getDb(), "trips", tripId, "rollcalls"),
      where("busId", "==", busId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as RollCall), id: d.id }));
      setRollcalls(list);
      setSelectedId((prev) => (prev && list.some((r) => r.id === prev) ? prev : (list[0]?.id ?? "")));
    });
    return () => unsub();
  }, [tripId, busId]);

  useEffect(() => {
    return () => {
      if (qrFeedbackTimer.current) clearTimeout(qrFeedbackTimer.current);
    };
  }, []);

  const selected = rollcalls.find((r) => r.id === selectedId) ?? null;

  async function createSession(name: string) {
    if (!name || !user || creatingSession) return;
    const existing = rollcalls.find((r) => r.sessionName === name);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    if (!access.isSuperLead) return;
    setCreatingSession(true);
    try {
      const ref = await addDoc(collection(getDb(), "trips", tripId, "rollcalls"), {
        tripId,
        busId,
        sessionName: name,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        records: {},
      });
      setSelectedId(ref.id);
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleCreateSession() {
    const name = newSessionName.trim();
    if (!name) return;
    await createSession(name);
    setNewSessionName("");
  }

  const pendingPlannedSessions = plannedSessions.filter(
    (name) => !rollcalls.some((r) => r.sessionName === name),
  );

  async function markStatus(passengerId: string, status: AttendanceStatus, source: "manual" | "qr") {
    if (!selected || !user) return;
    await updateDoc(doc(getDb(), "trips", tripId, "rollcalls", selected.id), {
      [`records.${passengerId}`]: {
        status,
        source,
        operatorUid: user.uid,
        timestamp: new Date().toISOString(),
      },
    });
  }

  function showQrFeedback(feedback: { type: "success" | "error"; message: string }) {
    if (qrFeedbackTimer.current) clearTimeout(qrFeedbackTimer.current);
    setQrFeedback(feedback);
    qrFeedbackTimer.current = setTimeout(() => setQrFeedback(null), 2500);
  }

  async function handleQrDecode(text: string) {
    const regNo = text.trim();
    const passenger = roster.find((p) => p.regNo === regNo);
    if (!passenger) {
      try {
        const result = await apiFetch<PassengerLookupResult>(
          `/api/trips/${tripId}/passengers/lookup?regNo=${encodeURIComponent(regNo)}&busId=${busId}`,
        );
        if (result.found && !result.sameBus) {
          showQrFeedback({
            type: "error",
            message: `${result.name ?? regNo} 不是本車人員,屬於「${result.busNumber ?? "其他車次"}」`,
          });
        } else {
          showQrFeedback({ type: "error", message: `查無報名序號「${regNo}」` });
        }
      } catch {
        showQrFeedback({ type: "error", message: `查無報名序號「${regNo}」` });
      }
      return;
    }
    await markStatus(passenger.id, "present", "qr");
    showQrFeedback({ type: "success", message: `${passenger.name} 報到成功` });
  }

  async function loadContact(passengerId: string): Promise<PassengerContactInfo> {
    if (contactCache[passengerId]) return contactCache[passengerId]!;
    const info = await apiFetch<PassengerContactInfo>(
      `/api/trips/${tripId}/passengers/${passengerId}/contact`,
    );
    setContactCache((c) => ({ ...c, [passengerId]: info }));
    return info;
  }

  async function handleDial(passengerId: string, kind: "self" | "emergency") {
    try {
      const info = await loadContact(passengerId);
      const number = kind === "self" ? info.phone : info.emergencyContactPhone;
      if (!number) {
        alert("查無電話號碼");
        return;
      }
      window.location.href = `tel:${number}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "取得電話失敗");
    }
  }

  const summary = useMemo(() => {
    if (!selected) return null;
    let present = 0;
    let leave = 0;
    for (const p of roster) {
      const status = selected.records[p.id]?.status;
      if (status === "present") present += 1;
      else if (status === "leave") leave += 1;
    }
    // 未明確點名者預設視為未到,不再另外算「未報到」,對齊規格書的三種狀態設計。
    return { total: roster.length, present, absent: roster.length - present - leave, leave };
  }, [roster, selected]);

  const filteredRoster = roster.filter((p) => {
    const matchesSearch =
      p.name.includes(search) ||
      p.regNo.includes(search) ||
      (search.length > 0 && p.phoneLast4.includes(search));
    if (!matchesSearch) return false;
    if (statusFilter) {
      const effectiveStatus: AttendanceStatus = selected?.records[p.id]?.status ?? "absent";
      if (effectiveStatus !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-xl font-semibold">現場點名</h1>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
        {access.isSuperLead && pendingPlannedSessions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingPlannedSessions.map((name) => (
              <button
                key={name}
                onClick={() => createSession(name)}
                disabled={creatingSession}
                className="rounded-md bg-brand-50 px-3 py-1.5 text-sm text-brand-700 disabled:opacity-60"
              >
                + 開始「{name}」
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {rollcalls.length === 0 && <option value="">尚無場次</option>}
            {rollcalls.map((r) => (
              <option key={r.id} value={r.id}>
                {r.sessionName}
              </option>
            ))}
          </select>
        </div>
        {access.isSuperLead && (
          <div className="flex items-center gap-2">
            <input
              placeholder="其他自訂場次名稱(規劃外)"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              onClick={handleCreateSession}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              開新場次
            </button>
          </div>
        )}
      </div>

      {!selected || !summary ? (
        <p className="text-sm text-gray-400">
          {access.isSuperLead ? "請先建立一個點名場次。" : "尚無點名場次,請聯絡總領隊建立場次。"}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <button
              onClick={() => setStatusFilter("")}
              className={clsx(
                "rounded-full px-2.5 py-1",
                statusFilter === "" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600",
              )}
            >
              共 {summary.total} 人
            </button>
            <button
              onClick={() => setStatusFilter((f) => (f === "present" ? "" : "present"))}
              className={clsx(
                "rounded-full px-2.5 py-1",
                statusFilter === "present" ? "bg-green-600 text-white" : "bg-green-50 text-green-700",
              )}
            >
              已到 {summary.present}
            </button>
            <button
              onClick={() => setStatusFilter((f) => (f === "absent" ? "" : "absent"))}
              className={clsx(
                "rounded-full px-2.5 py-1",
                statusFilter === "absent" ? "bg-red-600 text-white" : "bg-red-50 text-red-700",
              )}
            >
              未到 {summary.absent}
            </button>
            <button
              onClick={() => setStatusFilter((f) => (f === "leave" ? "" : "leave"))}
              className={clsx(
                "rounded-full px-2.5 py-1",
                statusFilter === "leave" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700",
              )}
            >
              請假 {summary.leave}
            </button>
          </div>

          {qrFeedback && (
            <div
              className={clsx(
                "rounded-lg border-2 px-4 py-3 text-center text-lg font-bold shadow-sm",
                qrFeedback.type === "success"
                  ? "border-green-400 bg-green-100 text-green-800"
                  : "border-red-400 bg-red-100 text-red-800",
              )}
            >
              {qrFeedback.type === "success" ? "✓" : "✕"} {qrFeedback.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              placeholder="搜尋姓名、序號或手機後四碼"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setScanning((s) => !s)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {scanning ? "取消掃描" : "掃描 QR"}
            </button>
          </div>

          {scanning && <QrScanner onDecode={handleQrDecode} onClose={() => setScanning(false)} />}

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {filteredRoster.map((p) => {
              const record = selected.records[p.id];
              // 未明確點名者預設視為未到(呼應規格書「一鍵撥打未到人員電話」的即時性)。
              const effectiveStatus: AttendanceStatus = record?.status ?? "absent";
              return (
                <li key={p.id} className="space-y-2 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.regNo}
                        {p.phoneLast4 && ` ・ ****${p.phoneLast4}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(["present", "absent", "leave"] as AttendanceStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => markStatus(p.id, status, "manual")}
                          className={clsx(
                            "rounded-md px-2 py-1 text-xs",
                            effectiveStatus === status ? STATUS_STYLES[status] : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {effectiveStatus === "absent" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDial(p.id, "self")}
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        撥打本人電話
                      </button>
                      <button
                        onClick={() => handleDial(p.id, "emergency")}
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        撥打緊急聯絡人
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
