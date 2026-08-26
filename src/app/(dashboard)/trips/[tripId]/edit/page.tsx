"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import type { Trip } from "@/types/trip";

export default function EditTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const access = useTripAccess(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busCount, setBusCount] = useState(1);
  const [plannedSessions, setPlannedSessions] = useState<string[]>([]);
  const [newSessionName, setNewSessionName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(getDb(), "trips", tripId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Trip;
      setTrip(data);
      setName(data.name);
      setDate(data.date);
      setBusCount(data.busCount);
      setPlannedSessions(data.plannedSessions ?? []);
    });
    return () => unsub();
  }, [tripId]);

  function handleAddSession() {
    const value = newSessionName.trim();
    if (!value || plannedSessions.includes(value)) return;
    setPlannedSessions((list) => [...list, value]);
    setNewSessionName("");
  }

  function handleRemoveSession(value: string) {
    setPlannedSessions((list) => list.filter((s) => s !== value));
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
      <div className="space-y-2">
        <label className="text-sm text-gray-600">
          點名場次規劃(各車領隊點名頁會依此清單一鍵開場次,確保全部車輛場次名稱一致)
        </label>
        <div className="flex gap-2">
          <input
            placeholder="例如:去程上車"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSession();
              }
            }}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddSession}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            新增場次
          </button>
        </div>
        {plannedSessions.length === 0 ? (
          <p className="text-xs text-gray-400">尚未規劃場次,各車領隊仍可在點名頁自行輸入場次名稱。</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {plannedSessions.map((s, i) => (
              <li
                key={s}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
              >
                {i + 1}. {s}
                <button
                  type="button"
                  onClick={() => handleRemoveSession(s)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
