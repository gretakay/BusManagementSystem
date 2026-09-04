"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { onSnapshotWithRetry, useRetryToken } from "@/lib/firebase/onSnapshotWithRetry";
import { InlineLoadError } from "@/components/InlineLoadError";
import { normalizePlannedSessions, type PlannedSessions, type Trip } from "@/types/trip";
import type { TripLeg } from "@/types/passenger";

const LEG_LABELS: Record<TripLeg, string> = {
  outbound: "去程",
  return: "回程",
};

export default function EditTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const access = useTripAccess(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busCount, setBusCount] = useState(1);
  const [plannedSessions, setPlannedSessions] = useState<PlannedSessions>({ outbound: [], return: [] });
  const [newSessionNames, setNewSessionNames] = useState<Record<TripLeg, string>>({
    outbound: "",
    return: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tripError, setTripError] = useState(false);
  const [retryToken, retry] = useRetryToken();

  useEffect(() => {
    setTripError(false);
    const unsub = onSnapshotWithRetry(
      doc(getDb(), "trips", tripId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Trip;
        setTrip(data);
        setName(data.name);
        setDate(data.date);
        setBusCount(data.busCount);
        setPlannedSessions(normalizePlannedSessions(data.plannedSessions));
        setTripError(false);
      },
      () => setTripError(true),
    );
    return () => unsub();
  }, [tripId, retryToken]);

  function handleAddSession(leg: TripLeg) {
    const value = newSessionNames[leg].trim();
    if (!value || plannedSessions[leg].includes(value)) return;
    setPlannedSessions((p) => ({ ...p, [leg]: [...p[leg], value] }));
    setNewSessionNames((n) => ({ ...n, [leg]: "" }));
  }

  function handleRemoveSession(leg: TripLeg, value: string) {
    setPlannedSessions((p) => ({ ...p, [leg]: p[leg].filter((s) => s !== value) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch<Trip>(`/api/trips/${tripId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, date, busCount: Number(busCount), plannedSessions }),
      });
      router.replace(`/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSubmitting(false);
    }
  }

  if (tripError) return <InlineLoadError onRetry={retry} />;
  if (!trip) return <p className="text-sm text-gray-400">載入中…</p>;

  if (!access.isSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限編輯此行程。</p>;
  }

  if (trip.status === "archived") {
    return <p className="text-sm text-gray-500">行程已封存,請先在行程頁解除封存後才能編輯。</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">編輯行程</h1>
      <div className="space-y-1">
        <label className="text-sm text-gray-600">活動名稱</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-gray-600">活動日期</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-gray-600">車輛數量</label>
        <input
          type="number"
          min={1}
          required
          value={busCount}
          onChange={(e) => setBusCount(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {(["outbound", "return"] as TripLeg[]).map((leg) => (
        <div key={leg} className="space-y-2">
          <label className="text-sm text-gray-600">
            {LEG_LABELS[leg]}點名場次規劃(各車領隊點名頁開新場次時,選這段就會列出這裡的名稱)
          </label>
          <div className="flex gap-2">
            <input
              placeholder={leg === "outbound" ? "例如:上車" : "例如:返程前"}
              value={newSessionNames[leg]}
              onChange={(e) => setNewSessionNames((n) => ({ ...n, [leg]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSession(leg);
                }
              }}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => handleAddSession(leg)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              新增場次
            </button>
          </div>
          {plannedSessions[leg].length === 0 ? (
            <p className="text-xs text-gray-400">尚未規劃場次,各車領隊仍可在點名頁自行輸入場次名稱。</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {plannedSessions[leg].map((s, i) => (
                <li
                  key={s}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  {i + 1}. {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(leg, s)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "儲存中…" : "儲存變更"}
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/trips/${tripId}`)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm"
        >
          取消
        </button>
      </div>
    </form>
  );
}
