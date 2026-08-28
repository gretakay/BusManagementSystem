"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import type { Bus } from "@/types/bus";
import type { PassengerListItem } from "@/types/passenger";

/**
 * 排車頁面(MVP):目前僅實作「逐一調整」(下拉選單變更車次)+ 排車總覽。
 * 拖曳介面與批次條件分派為 Phase 2 TODO(規格書 §5.2.1 方式二、三),
 * 屆時可在此頁面加入 @dnd-kit 的人員池/車輛卡片拖曳區塊,以及依身分別/組別篩選的批次指派表單。
 */
export default function SeatingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(getDb(), "trips", tripId, "buses"), orderBy("busNumber"));
    const unsub = onSnapshot(q, (snap) => setBuses(snap.docs.map((d) => d.data() as Bus)));
    return () => unsub();
  }, [tripId]);

  async function loadPassengers() {
    setLoading(true);
    try {
      const items = await apiFetch<PassengerListItem[]>(`/api/trips/${tripId}/passengers`);
      setPassengers(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPassengers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    let unassigned = 0;
    for (const p of passengers) {
      if (p.busId) map.set(p.busId, (map.get(p.busId) ?? 0) + 1);
      else unassigned += 1;
    }
    return { byBus: map, unassigned };
  }, [passengers]);

  async function handleReassign(passengerId: string, busId: string) {
    const nextBusId = busId === "" ? null : busId;
    try {
      const updated = await apiFetch<PassengerListItem>(
        `/api/trips/${tripId}/passengers/${passengerId}`,
        { method: "PATCH", body: JSON.stringify({ busId: nextBusId }) },
      );
      setPassengers((prev) => prev.map((p) => (p.id === passengerId ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "調整失敗");
    }
  }

  if (!access.isSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限查看此行程的排車。</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">排車</h1>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500">排車總覽</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {buses.map((bus) => {
            const assigned = counts.byBus.get(bus.id) ?? 0;
            const over = assigned > bus.seatCapacity;
            return (
              <li
                key={bus.id}
                className={`rounded-lg border p-3 text-sm ${
                  over ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                }`}
              >
                <p className="font-medium">{bus.busNumber}</p>
                <p className={over ? "text-red-600" : "text-gray-500"}>
                  已分配 {assigned} / 座位上限 {bus.seatCapacity}
                  {over && "(超載)"}
                </p>
              </li>
            );
          })}
          <li className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <p className="font-medium">尚未分配</p>
            <p className="text-gray-500">{counts.unassigned} 人</p>
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
          人員車次調整(逐一調整)
        </h2>
        {loading ? (
          <p className="p-4 text-sm text-gray-400">載入中…</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {passengers.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  {p.name}
                  <span className="ml-2 text-xs text-gray-400">{p.regNo}</span>
                </span>
                <select
                  value={p.busId ?? ""}
                  onChange={(e) => handleReassign(p.id, e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">未分配</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
