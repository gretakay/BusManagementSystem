"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import type { Bus } from "@/types/bus";
import type { PassengerListItem } from "@/types/passenger";

const UNASSIGNED = "__unassigned__";

/**
 * 排車頁面(MVP):篩選分頁(全部/尚未分配/各車)+ 逐一調整 + 勾選多筆批次指派 + 排車總覽。
 * 拖曳介面與批次條件分派(依身分別/組別)為 Phase 2 TODO(規格書 §5.2.1 方式二、三)。
 */
export default function SeatingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetBusId, setBulkTargetBusId] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);

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

  const filteredPassengers = passengers.filter((p) => {
    if (filter === UNASSIGNED && p.busId) return false;
    if (filter && filter !== UNASSIGNED && p.busId !== filter) return false;
    if (search && !p.name.includes(search) && !p.regNo.includes(search)) return false;
    return true;
  });

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const allSelected = filteredPassengers.every((p) => prev.has(p.id));
      if (allSelected) {
        const next = new Set(prev);
        filteredPassengers.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filteredPassengers.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    const nextBusId = bulkTargetBusId === "" ? null : bulkTargetBusId;
    const ids = Array.from(selectedIds);
    try {
      await apiFetch(`/api/trips/${tripId}/passengers/bulk-reassign`, {
        method: "POST",
        body: JSON.stringify({ passengerIds: ids, busId: nextBusId }),
      });
      const idSet = new Set(ids);
      setPassengers((prev) => prev.map((p) => (idSet.has(p.id) ? { ...p, busId: nextBusId } : p)));
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "批次指派失敗");
    } finally {
      setBulkApplying(false);
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
        <div className="space-y-3 border-b border-gray-100 p-4">
          <h2 className="text-sm font-medium text-gray-500">人員車次調整</h2>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setFilter("")}
              className={clsx(
                "rounded-full px-3 py-1",
                filter === "" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
              )}
            >
              全部({passengers.length})
            </button>
            <button
              onClick={() => setFilter(UNASSIGNED)}
              className={clsx(
                "rounded-full px-3 py-1",
                filter === UNASSIGNED ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
              )}
            >
              尚未分配({counts.unassigned})
            </button>
            {buses.map((bus) => (
              <button
                key={bus.id}
                onClick={() => setFilter(bus.id)}
                className={clsx(
                  "rounded-full px-3 py-1",
                  filter === bus.id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                )}
              >
                {bus.busNumber}({counts.byBus.get(bus.id) ?? 0})
              </button>
            ))}
          </div>

          <input
            placeholder="搜尋姓名或報名序號"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-brand-50 px-3 py-2 text-sm">
              <span>已選 {selectedIds.size} 人</span>
              <select
                value={bulkTargetBusId}
                onChange={(e) => setBulkTargetBusId(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="">未分配</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.busNumber}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkApply}
                disabled={bulkApplying}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {bulkApplying ? "套用中…" : "套用到選取的人"}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-500"
              >
                清除選取
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="p-4 text-sm text-gray-400">載入中…</p>
        ) : filteredPassengers.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">沒有符合條件的人員。</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            <li className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={filteredPassengers.length > 0 && filteredPassengers.every((p) => selectedIds.has(p.id))}
                onChange={toggleSelectAllFiltered}
              />
              全選目前篩選結果
            </li>
            {filteredPassengers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <label className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelected(p.id)}
                  />
                  <span>
                    {p.name}
                    <span className="ml-2 text-xs text-gray-400">{p.regNo}</span>
                  </span>
                </label>
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
