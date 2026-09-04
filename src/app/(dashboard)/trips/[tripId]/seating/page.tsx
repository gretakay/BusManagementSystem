"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { collection, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { onSnapshotWithRetry, useRetryToken } from "@/lib/firebase/onSnapshotWithRetry";
import { InlineLoadError } from "@/components/InlineLoadError";
import { Pagination } from "@/components/Pagination";
import type { Bus } from "@/types/bus";
import type { PassengerIdentity, PassengerListItem, TripLeg } from "@/types/passenger";

const UNASSIGNED = "__unassigned__";
const PAGE_SIZE = 50;

const LEG_LABELS: Record<TripLeg, string> = {
  outbound: "去程",
  return: "回程",
};

const IDENTITY_LABELS: Record<PassengerIdentity, string> = {
  guest: "貴賓",
  believer: "信眾",
  volunteer: "義工",
};

/**
 * 排車頁面(MVP):去程/回程各自獨立排車(可能搭不同車)+
 * 篩選分頁(全部/尚未分配/各車)+ 逐一調整 + 勾選多筆批次指派 + 排車總覽。
 * 自行開車的人也視為搭一台(虛擬)車輛,不做特殊狀態,才能沿用既有點名功能。
 * 拖曳介面與批次條件分派(依身分別/組別)為 Phase 2 TODO(規格書 §5.2.1 方式二、三)。
 */
export default function SeatingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [leg, setLeg] = useState<TripLeg>("outbound");
  const [filter, setFilter] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [identityFilter, setIdentityFilter] = useState<PassengerIdentity | "">("");
  const [volunteerGroupFilter, setVolunteerGroupFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetBusId, setBulkTargetBusId] = useState("");
  const [bulkTargetGroup, setBulkTargetGroup] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [busesError, setBusesError] = useState(false);
  const [retryToken, retry] = useRetryToken();

  const busIdField = leg === "return" ? "returnBusId" : "busId";

  useEffect(() => {
    const q = query(collection(getDb(), "trips", tripId, "buses"), orderBy("busNumber"));
    const unsub = onSnapshotWithRetry(
      q,
      (snap) => {
        setBuses(snap.docs.map((d) => d.data() as Bus));
        setBusesError(false);
      },
      () => setBusesError(true),
    );
    return () => unsub();
  }, [tripId, retryToken]);

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

  // 切換去程/回程時,先前的篩選/選取條件通常不再有意義,重置避免誤操作到另一段的資料。
  useEffect(() => {
    setFilter("");
    setGroupFilter("");
    setSelectedIds(new Set());
    setBulkTargetBusId("");
  }, [leg]);

  // 換一台車之後,原本選的組別多半不屬於這台車,重置避免篩到空結果。
  useEffect(() => {
    setGroupFilter("");
  }, [filter]);

  // 切換身分別時,底下的義工組別子篩選也要重置。
  useEffect(() => {
    setVolunteerGroupFilter("");
  }, [identityFilter]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    let unassigned = 0;
    for (const p of passengers) {
      const busId = p[busIdField];
      if (busId) map.set(busId, (map.get(busId) ?? 0) + 1);
      else unassigned += 1;
    }
    return { byBus: map, unassigned };
  }, [passengers, busIdField]);

  const identityCounts = useMemo(() => {
    const map = new Map<PassengerIdentity, number>();
    for (const p of passengers) map.set(p.identity, (map.get(p.identity) ?? 0) + 1);
    return map;
  }, [passengers]);

  const volunteerGroups = useMemo(() => {
    const set = new Set<string>();
    for (const p of passengers) {
      if (p.identity === "volunteer" && p.volunteerGroup) set.add(p.volunteerGroup);
    }
    return Array.from(set).sort();
  }, [passengers]);

  async function handleReassign(passengerId: string, busId: string) {
    const nextBusId = busId === "" ? null : busId;
    try {
      const updated = await apiFetch<PassengerListItem>(
        `/api/trips/${tripId}/passengers/${passengerId}`,
        { method: "PATCH", body: JSON.stringify({ leg, busId: nextBusId }) },
      );
      setPassengers((prev) => prev.map((p) => (p.id === passengerId ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "調整失敗");
    }
  }

  function handleGroupInputChange(id: string, value: string) {
    setGroupDrafts((d) => ({ ...d, [id]: value }));
  }

  async function handleGroupBlur(id: string) {
    const value = groupDrafts[id];
    if (value === undefined) return;
    const current = passengers.find((p) => p.id === id);
    if (current && (current.busGroup ?? "") === value) return;
    try {
      const updated = await apiFetch<PassengerListItem>(`/api/trips/${tripId}/passengers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ busGroup: value }),
      });
      setPassengers((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "組別更新失敗");
    }
  }

  /** 只有選到特定車輛時,組別篩選才有意義(組別是車內的小分組)。 */
  const groupsForSelectedBus = useMemo(() => {
    if (!filter || filter === UNASSIGNED) return [];
    const set = new Set<string>();
    for (const p of passengers) {
      if (p[busIdField] === filter && p.busGroup) set.add(p.busGroup);
    }
    return Array.from(set).sort();
  }, [passengers, busIdField, filter]);

  const filteredPassengers = passengers.filter((p) => {
    const busId = p[busIdField];
    if (filter === UNASSIGNED && busId) return false;
    if (filter && filter !== UNASSIGNED && busId !== filter) return false;
    if (groupFilter && p.busGroup !== groupFilter) return false;
    if (identityFilter && p.identity !== identityFilter) return false;
    if (volunteerGroupFilter && p.volunteerGroup !== volunteerGroupFilter) return false;
    if (search && !p.name.includes(search) && !p.regNo.includes(search)) return false;
    return true;
  });

  // 篩選條件一變,結果集就變了,回到第一頁避免停在超出範圍的空頁面。
  useEffect(() => {
    setPage(1);
  }, [leg, filter, groupFilter, identityFilter, volunteerGroupFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filteredPassengers.length / PAGE_SIZE));
  const pagedPassengers = filteredPassengers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        body: JSON.stringify({
          passengerIds: ids,
          leg,
          busId: nextBusId,
          // 組別欄位留空表示這次批次指派不動組別,只改車次;有填才會一併套用(常見於指派小車時順便標記車號)。
          ...(bulkTargetGroup ? { busGroup: bulkTargetGroup } : {}),
        }),
      });
      // 去程批次指派時,回程可能依人各自不同步(未設定過才會跟著同步),不能用單一值樂觀更新,直接重新讀取。
      await loadPassengers();
      setSelectedIds(new Set());
      setBulkTargetGroup("");
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

      {busesError && <InlineLoadError variant="banner" onRetry={retry} />}

      <div className="flex items-center gap-2">
        {(["outbound", "return"] as TripLeg[]).map((l) => (
          <button
            key={l}
            onClick={() => setLeg(l)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              leg === l ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
            )}
          >
            {LEG_LABELS[l]}
          </button>
        ))}
        <span className="text-xs text-gray-400">
          去程/回程各自獨立排車,可能搭不同車,調整前請確認上面選的是哪一段
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500">{LEG_LABELS[leg]}排車總覽</h2>
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
          <h2 className="text-sm font-medium text-gray-500">人員車次調整({LEG_LABELS[leg]})</h2>
          <p className="text-xs text-gray-400">
            「組別」欄位可標記車內小組(例如小客車車號),搭配該車小組長的指派可只看自己組別,去回程共用同一個組別。
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400">身分別:</span>
            <button
              onClick={() => setIdentityFilter("")}
              className={clsx(
                "rounded-full px-3 py-1",
                identityFilter === "" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
              )}
            >
              全部
            </button>
            {(Object.keys(IDENTITY_LABELS) as PassengerIdentity[]).map((id) => (
              <button
                key={id}
                onClick={() => setIdentityFilter((f) => (f === id ? "" : id))}
                className={clsx(
                  "rounded-full px-3 py-1",
                  identityFilter === id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                )}
              >
                {IDENTITY_LABELS[id]}({identityCounts.get(id) ?? 0})
              </button>
            ))}
          </div>

          {identityFilter === "volunteer" && volunteerGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400">義工組別:</span>
              <button
                onClick={() => setVolunteerGroupFilter("")}
                className={clsx(
                  "rounded-full px-3 py-1",
                  volunteerGroupFilter === "" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                )}
              >
                全部組別
              </button>
              {volunteerGroups.map((g) => (
                <button
                  key={g}
                  onClick={() => setVolunteerGroupFilter((f) => (f === g ? "" : g))}
                  className={clsx(
                    "rounded-full px-3 py-1",
                    volunteerGroupFilter === g ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400">車次:</span>
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

          {groupsForSelectedBus.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400">組別篩選:</span>
              <button
                onClick={() => setGroupFilter("")}
                className={clsx(
                  "rounded-full px-3 py-1",
                  groupFilter === "" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                )}
              >
                全部組別
              </button>
              {groupsForSelectedBus.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupFilter((f) => (f === g ? "" : g))}
                  className={clsx(
                    "rounded-full px-3 py-1",
                    groupFilter === g ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <input
            placeholder="搜尋姓名或報名序號"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} edge="top" />

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
              <input
                placeholder="組別(選填,例如小客車車號)"
                value={bulkTargetGroup}
                onChange={(e) => setBulkTargetGroup(e.target.value)}
                className="w-44 rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
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
              全選目前篩選結果(共 {filteredPassengers.length} 人,不限本頁)
            </li>
            {pagedPassengers.map((p) => (
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
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {IDENTITY_LABELS[p.identity]}
                      {p.identity === "volunteer" && p.volunteerGroup ? `・${p.volunteerGroup}` : ""}
                    </span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="組別"
                    value={groupDrafts[p.id] ?? p.busGroup ?? ""}
                    onChange={(e) => handleGroupInputChange(p.id, e.target.value)}
                    onBlur={() => handleGroupBlur(p.id)}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={p[busIdField] ?? ""}
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
