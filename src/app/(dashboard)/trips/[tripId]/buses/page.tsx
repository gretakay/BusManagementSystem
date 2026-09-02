"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { Pagination } from "@/components/Pagination";
import type { Bus } from "@/types/bus";
import type { BusRole } from "@/types/role";

const ROLE_LABELS: Record<BusRole, string> = {
  leader: "領隊",
  coLeader: "副領隊",
  groupLeader: "小組長",
};

const PAGE_SIZE = 50;

export default function BusesPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    busNumber: "",
    driverName: "",
    driverPhone: "",
    seatCapacity: 40,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = query(collection(getDb(), "trips", tripId, "buses"), orderBy("busNumber"));
    const unsub = onSnapshot(q, (snap) => setBuses(snap.docs.map((d) => d.data() as Bus)));
    return () => unsub();
  }, [tripId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch(`/api/trips/${tripId}/buses`, {
        method: "POST",
        body: JSON.stringify({ ...form, seatCapacity: Number(form.seatCapacity) }),
      });
      setForm({ busNumber: "", driverName: "", driverPhone: "", seatCapacity: 40 });
    } catch (err) {
      alert(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setCreating(false);
    }
  }

  const filteredBuses = buses.filter(
    (b) => !search || b.busNumber.includes(search) || (b.driverName ?? "").includes(search),
  );
  const pageCount = Math.max(1, Math.ceil(filteredBuses.length / PAGE_SIZE));
  const pagedBuses = filteredBuses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!access.isSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限查看此行程的車輛管理。</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">車輛管理</h1>
        <Link href={`/trips/${tripId}/leaders`} className="text-sm text-brand-600">
          前往領隊管理 →
        </Link>
      </div>

      <form onSubmit={handleCreate} className="grid max-w-lg gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-500">新增車輛</h2>
        <input
          required
          placeholder="車次編號(例如:1號車)"
          value={form.busNumber}
          onChange={(e) => setForm((f) => ({ ...f, busNumber: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="司機姓名"
            value={form.driverName}
            onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="司機電話"
            value={form.driverPhone}
            onChange={(e) => setForm((f) => ({ ...f, driverPhone: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">座位上限</label>
          <input
            type="number"
            min={1}
            required
            value={form.seatCapacity}
            onChange={(e) => setForm((f) => ({ ...f, seatCapacity: Number(e.target.value) }))}
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {creating ? "建立中…" : "新增車輛"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-gray-500">
          車輛清單({filteredBuses.length}
          {filteredBuses.length !== buses.length ? ` / 共 ${buses.length}` : ""})
        </h2>
        <input
          placeholder="搜尋車次或司機姓名"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {filteredBuses.length === 0 ? (
        <p className="text-sm text-gray-400">沒有符合條件的車輛。</p>
      ) : (
        <ul className="space-y-3">
          {pagedBuses.map((bus) => (
            <li key={bus.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="font-medium">
                {bus.busNumber}(座位上限 {bus.seatCapacity})
              </p>
              {bus.driverName && (
                <p className="mt-1 text-sm text-gray-500">
                  司機:{bus.driverName} {bus.driverPhone}
                </p>
              )}
              <ul className="mt-2 flex flex-wrap gap-2">
                {bus.leaders.length === 0 ? (
                  <li className="text-xs text-gray-400">尚未指派</li>
                ) : (
                  bus.leaders.map((l) => (
                    <li
                      key={l.uid}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      {ROLE_LABELS[l.role]}:{l.displayName ? `${l.displayName}(${l.email})` : l.email}
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
