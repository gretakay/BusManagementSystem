"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { collection, doc, documentId, getCountFromServer, getDoc, orderBy, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { apiFetch } from "@/lib/api/client";
import { onSnapshotWithRetry, useRetryToken } from "@/lib/firebase/onSnapshotWithRetry";
import { InlineLoadError } from "@/components/InlineLoadError";
import type { Bus } from "@/types/bus";
import type { PassengerExportItem, PassengerIdentity, PassengerListItem, TripLeg } from "@/types/passenger";
import type { AttendanceStatus, RollCall } from "@/types/rollcall";
import type { Trip } from "@/types/trip";

const LEG_LABELS: Record<TripLeg, string> = {
  outbound: "去程",
  return: "回程",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "已到",
  absent: "未到",
  leave: "請假",
};

const IDENTITY_LABELS: Record<PassengerIdentity, string> = {
  guest: "貴賓",
  believer: "信眾",
  volunteer: "義工",
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-600 text-white",
  absent: "bg-red-500 text-white",
  leave: "bg-amber-500 text-white",
};

export default function TripDashboardPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [rollcalls, setRollcalls] = useState<RollCall[]>([]);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});
  const [rosterByBus, setRosterByBus] = useState<Record<string, PassengerListItem[]>>({});
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null);
  const [activeLeg, setActiveLeg] = useState<TripLeg>("outbound");
  const busIdField = activeLeg === "return" ? "returnBusId" : "busId";
  const [exporting, setExporting] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [retryToken, retry] = useRetryToken();

  /**
   * 全台車都看得到時直接照 busNumber 排序查詢;只被指派特定車輛的領隊,
   * 用 documentId() in 指派車輛清單來查(車輛 rules 是依文件 ID 判斷,不是資料欄位),
   * 這樣 Firestore 才能確定這個查詢一定不會回傳沒權限的車輛,不然整包查詢會被拒絕(見 buses/page.tsx 的教訓)。
   */
  useEffect(() => {
    if (!access.canViewAllBuses && access.assignedBusIds.length === 0) {
      setBuses([]);
      setDataError(false);
      return;
    }
    const busesRef = collection(getDb(), "trips", tripId, "buses");
    const q = access.canViewAllBuses
      ? query(busesRef, orderBy("busNumber"))
      : query(busesRef, where(documentId(), "in", access.assignedBusIds.slice(0, 30)));
    const unsub = onSnapshotWithRetry(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Bus);
        list.sort((a, b) => a.busNumber.localeCompare(b.busNumber));
        setBuses(list);
        setDataError(false);
      },
      () => setDataError(true),
    );
    return () => unsub();
  }, [tripId, access.canViewAllBuses, access.assignedBusIds, retryToken]);

  useEffect(() => {
    const col = collection(getDb(), "trips", tripId, "rollcalls");
    const q =
      access.canViewAllBuses || access.assignedBusIds.length === 0
        ? query(col)
        : query(col, where("busId", "in", access.assignedBusIds.slice(0, 30)));
    const unsub = onSnapshotWithRetry(
      q,
      (snap) => {
        setRollcalls(snap.docs.map((d) => d.data() as RollCall));
        setDataError(false);
      },
      () => setDataError(true),
    );
    return () => unsub();
  }, [tripId, access.canViewAllBuses, access.assignedBusIds, retryToken]);

  async function refreshAssignedCounts() {
    try {
      const entries = await Promise.all(
        buses.map(async (bus) => {
          const snap = await getCountFromServer(
            query(collection(getDb(), "trips", tripId, "passengers"), where(busIdField, "==", bus.id)),
          );
          return [bus.id, snap.data().count] as const;
        }),
      );
      setAssignedCounts(Object.fromEntries(entries));
    } catch (err) {
      console.error("refreshAssignedCounts failed", err);
      setDataError(true);
    }
  }

  useEffect(() => {
    if (buses.length > 0) refreshAssignedCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buses.map((b) => b.id).join(","), busIdField]);

  // 換去程/回程時,展開的名單是另一段的資料,收合並清快取避免顯示錯段。
  useEffect(() => {
    setExpandedBusId(null);
    setRosterByBus({});
  }, [activeLeg]);

  const latestByBus = useMemo(() => {
    const map = new Map<string, RollCall>();
    for (const rc of rollcalls) {
      if ((rc.leg ?? "outbound") !== activeLeg) continue;
      const current = map.get(rc.busId);
      if (!current || rc.createdAt > current.createdAt) map.set(rc.busId, rc);
    }
    return map;
  }, [rollcalls, activeLeg]);

  const visibleBuses = access.canViewAllBuses ? buses : buses.filter((b) => access.canAccessBus(b.id));

  async function handleToggleExpand(busId: string) {
    if (expandedBusId === busId) {
      setExpandedBusId(null);
      return;
    }
    setExpandedBusId(busId);
    if (!rosterByBus[busId]) {
      try {
        const items = await apiFetch<PassengerListItem[]>(
          `/api/trips/${tripId}/passengers?busId=${busId}&leg=${activeLeg}`,
        );
        setRosterByBus((prev) => ({ ...prev, [busId]: items }));
      } catch {
        setRosterByBus((prev) => ({ ...prev, [busId]: [] }));
      }
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const [tripSnap, passengers] = await Promise.all([
        getDoc(doc(getDb(), "trips", tripId)),
        apiFetch<PassengerExportItem[]>(`/api/trips/${tripId}/passengers/export`),
      ]);
      const tripName = tripSnap.exists() ? (tripSnap.data() as Trip).name : tripId;
      const busNumberById = new Map(buses.map((b) => [b.id, b.busNumber]));

      // 這份報表是離線時的紙本備援,所以連完整電話都要有,不然斷網時撥不了未到人員的電話。
      const passengerRows = passengers.map((p) => ({
        報名序號: p.regNo,
        姓名: p.name,
        法名: p.dharmaName ?? "",
        身分別: IDENTITY_LABELS[p.identity],
        義工組別: p.volunteerGroup ?? "",
        去程車次: (p.busId && busNumberById.get(p.busId)) ?? (p.busId ? p.busId : "未分配"),
        回程車次: (p.returnBusId && busNumberById.get(p.returnBusId)) ?? (p.returnBusId ? p.returnBusId : "未分配"),
        組別: p.busGroup ?? "",
        寮房資訊: p.lodgingInfo ?? "",
        手機號碼: p.phone ?? "",
        緊急聯絡人姓名: p.emergencyContactName ?? "",
        緊急聯絡人電話: p.emergencyContactPhone ?? "",
      }));

      // 點名紀錄用長格式(每個場次每個人一列),方便日後查核誰在哪個場次被誰標記、什麼時間標記。
      const nameById = new Map(passengers.map((p) => [p.id, p.name]));
      const regNoById = new Map(passengers.map((p) => [p.id, p.regNo]));
      const rollcallRows: Record<string, string>[] = [];
      for (const rc of rollcalls) {
        const busNumber = busNumberById.get(rc.busId) ?? rc.busId;
        for (const [passengerId, record] of Object.entries(rc.records)) {
          rollcallRows.push({
            車次: busNumber,
            去回程: LEG_LABELS[rc.leg ?? "outbound"],
            場次: rc.sessionName,
            姓名: nameById.get(passengerId) ?? passengerId,
            報名序號: regNoById.get(passengerId) ?? "",
            狀態: STATUS_LABELS[record.status],
            點名時間: new Date(record.timestamp).toLocaleString("zh-TW", { hour12: false }),
            方式: record.source === "qr" ? "QR 掃描" : "手動",
          });
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(passengerRows), "人員名單");
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rollcallRows.length > 0 ? rollcallRows : [{ 說明: "尚無點名紀錄" }]),
        "點名紀錄",
      );
      XLSX.writeFile(workbook, `${tripName}_點名報表.xlsx`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "匯出失敗");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {(["outbound", "return"] as TripLeg[]).map((leg) => (
            <button
              key={leg}
              onClick={() => setActiveLeg(leg)}
              className={clsx(
                "rounded-full px-3 py-1 text-sm font-medium",
                activeLeg === leg ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600",
              )}
            >
              {LEG_LABELS[leg]}
            </button>
          ))}
        </div>
        {access.isSuperLead && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {exporting ? "匯出中…" : "匯出報表"}
          </button>
        )}
      </div>
      {dataError && <InlineLoadError variant="banner" onRetry={retry} />}
      <h2 className="text-sm font-medium text-gray-500">
        各車即時完成度({LEG_LABELS[activeLeg]}・最新場次)
      </h2>
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
  );
}
