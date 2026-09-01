"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  collection,
  doc,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { apiFetch } from "@/lib/api/client";
import { TripStatusBadge } from "@/components/trip/TripStatusBadge";
import type { Trip } from "@/types/trip";
import type { Bus } from "@/types/bus";
import type { PassengerListItem } from "@/types/passenger";
import type { AttendanceStatus, RollCall } from "@/types/rollcall";
import type { BusRole } from "@/types/role";

const BUS_ROLE_LABELS: Record<BusRole, string> = {
  leader: "領隊",
  coLeader: "副領隊",
  groupLeader: "小組長",
};

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

export default function TripDashboardPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const access = useTripAccess(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [rollcalls, setRollcalls] = useState<RollCall[]>([]);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});
  const [unarchiving, setUnarchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rosterByBus, setRosterByBus] = useState<Record<string, PassengerListItem[]>>({});
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(getDb(), "trips", tripId), (snap) => {
      if (snap.exists()) setTrip(snap.data() as Trip);
    });
    return () => unsub();
  }, [tripId]);

  useEffect(() => {
    const q = query(collection(getDb(), "trips", tripId, "buses"), orderBy("busNumber"));
    const unsub = onSnapshot(q, (snap) => setBuses(snap.docs.map((d) => d.data() as Bus)));
    return () => unsub();
  }, [tripId]);

  useEffect(() => {
    const col = collection(getDb(), "trips", tripId, "rollcalls");
    const q =
      access.isSuperLead || access.assignedBusIds.length === 0
        ? query(col)
        : query(col, where("busId", "in", access.assignedBusIds.slice(0, 30)));
    const unsub = onSnapshot(q, (snap) => setRollcalls(snap.docs.map((d) => d.data() as RollCall)));
    return () => unsub();
  }, [tripId, access.isSuperLead, access.assignedBusIds]);

  async function refreshAssignedCounts() {
    const entries = await Promise.all(
      buses.map(async (bus) => {
        const snap = await getCountFromServer(
          query(collection(getDb(), "trips", tripId, "passengers"), where("busId", "==", bus.id)),
        );
        return [bus.id, snap.data().count] as const;
      }),
    );
    setAssignedCounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    if (buses.length > 0) refreshAssignedCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buses.map((b) => b.id).join(",")]);

  const latestByBus = useMemo(() => {
    const map = new Map<string, RollCall>();
    for (const rc of rollcalls) {
      const current = map.get(rc.busId);
      if (!current || rc.createdAt > current.createdAt) map.set(rc.busId, rc);
    }
    return map;
  }, [rollcalls]);

  const visibleBuses = access.isSuperLead
    ? buses
    : buses.filter((b) => access.canAccessBus(b.id));

  const identityLabel = useMemo(() => {
    if (role?.globalSuperLead) return "總負責人(全域)";
    if ((trip?.superLeads ?? []).some((s) => s.uid === access.uid)) return "此行程總領隊";
    const busRoles = role?.trips?.[tripId]?.busRoles ?? {};
    const parts = Object.entries(busRoles).map(([busId, busRole]) => {
      const busNumber = buses.find((b) => b.id === busId)?.busNumber ?? busId;
      return `${BUS_ROLE_LABELS[busRole]}(${busNumber})`;
    });
    return parts.length > 0 ? parts.join("、") : "尚無此行程角色";
  }, [role, trip, buses, tripId, access.uid]);

  async function handleToggleExpand(busId: string) {
    if (expandedBusId === busId) {
      setExpandedBusId(null);
      return;
    }
    setExpandedBusId(busId);
    if (!rosterByBus[busId]) {
      try {
        const items = await apiFetch<PassengerListItem[]>(
          `/api/trips/${tripId}/passengers?busId=${busId}`,
        );
        setRosterByBus((prev) => ({ ...prev, [busId]: items }));
      } catch {
        setRosterByBus((prev) => ({ ...prev, [busId]: [] }));
      }
    }
  }

  async function handleUnarchive() {
    setUnarchiving(true);
    try {
      await apiFetch(`/api/trips/${tripId}/archive`, { method: "POST" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "解除封存失敗");
    } finally {
      setUnarchiving(false);
    }
  }

  async function handleDelete() {
    if (!trip) return;
    if (!confirm(`確定要永久刪除行程「${trip.name}」嗎?車輛、點名紀錄、乘客名單都會一併刪除,無法復原。`)) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/api/trips/${tripId}`, { method: "DELETE" });
      router.replace("/trips");
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
      setDeleting(false);
    }
  }

  if (!trip) return <p className="text-sm text-gray-400">載入中…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{trip.name}</h1>
          <p className="text-sm text-gray-400">
            {trip.date} ・ {trip.busCount} 台車
          </p>
          <p className="mt-1 text-xs text-brand-700">你的身分:{identityLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <TripStatusBadge status={trip.status} />
          {trip.status === "archived" && access.isSuperLead && (
            <button
              onClick={handleUnarchive}
              disabled={unarchiving}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-60"
            >
              {unarchiving ? "處理中…" : "解除封存"}
            </button>
          )}
        </div>
      </div>

      {access.isSuperLead && (
        <div className="flex flex-wrap gap-2 text-sm">
          {trip.status !== "archived" && (
            <Link href={`/trips/${tripId}/edit`} className="rounded-md border border-gray-300 px-3 py-1.5">
              編輯行程
            </Link>
          )}
          <Link href={`/trips/${tripId}/buses`} className="rounded-md border border-gray-300 px-3 py-1.5">
            車輛管理
          </Link>
          <Link href={`/trips/${tripId}/leaders`} className="rounded-md border border-gray-300 px-3 py-1.5">
            領隊管理
          </Link>
          <Link
            href={`/trips/${tripId}/passengers`}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            人員管理
          </Link>
          <Link href={`/trips/${tripId}/seating`} className="rounded-md border border-gray-300 px-3 py-1.5">
            排車
          </Link>
          {role?.globalSuperLead && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-300 px-3 py-1.5 text-red-600 disabled:opacity-60"
            >
              {deleting ? "刪除中…" : "刪除行程"}
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">各車即時完成度(最新場次)</h2>
        {visibleBuses.length === 0 ? (
          <p className="text-sm text-gray-400">尚無可查看的車輛。</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibleBuses.map((bus) => {
              const latest = latestByBus.get(bus.id);
              const assigned = assignedCounts[bus.id] ?? 0;
              const present = latest
                ? Object.values(latest.records).filter((r) => r.status === "present").length
                : 0;
              const overCapacity = assigned > bus.seatCapacity;
              return (
                <li key={bus.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{bus.busNumber}</p>
                    <span className={overCapacity ? "text-xs text-red-600" : "text-xs text-gray-400"}>
                      {assigned}/{bus.seatCapacity} 人{overCapacity ? "(超載)" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {latest ? (
                      <>
                        場次「{latest.sessionName}」實到 {present} / {assigned}
                      </>
                    ) : (
                      "尚未點名"
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <Link href={`/trips/${tripId}/buses/${bus.id}/rollcall`} className="text-brand-600">
                      前往點名 →
                    </Link>
                    {latest && (
                      <button onClick={() => handleToggleExpand(bus.id)} className="text-gray-500">
                        {expandedBusId === bus.id ? "收合名單 ▲" : "看誰到誰沒到 ▼"}
                      </button>
                    )}
                  </div>
                  {expandedBusId === bus.id && latest && (
                    <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100 pt-2">
                      {(rosterByBus[bus.id] ?? []).length === 0 ? (
                        <li className="py-2 text-xs text-gray-400">載入中…</li>
                      ) : (
                        (rosterByBus[bus.id] ?? [])
                          .slice()
                          .sort((a, b) => {
                            const order: Record<string, number> = {
                              absent: 0,
                              leave: 1,
                              unmarked: 2,
                              present: 3,
                            };
                            const sa = latest.records[a.id]?.status ?? "unmarked";
                            const sb = latest.records[b.id]?.status ?? "unmarked";
                            return order[sa]! - order[sb]!;
                          })
                          .map((p) => {
                            const status = latest.records[p.id]?.status;
                            return (
                              <li key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                                <span>{p.name}</span>
                                <span
                                  className={clsx(
                                    "rounded-md px-2 py-0.5 text-xs",
                                    status ? STATUS_STYLES[status] : "bg-gray-100 text-gray-400",
                                  )}
                                >
                                  {status ? STATUS_LABELS[status] : "未點名"}
                                </span>
                              </li>
                            );
                          })
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
