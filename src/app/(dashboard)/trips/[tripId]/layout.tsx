"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import { apiFetch } from "@/lib/api/client";
import { TripStatusBadge } from "@/components/trip/TripStatusBadge";
import { DeleteTripDialog } from "@/components/trip/DeleteTripDialog";
import { BroadcastPanel } from "@/components/trip/BroadcastPanel";
import { tripRoleSummary } from "@/types/role";
import type { Trip } from "@/types/trip";

const TABS = [
  { href: "", label: "總覽" },
  { href: "/edit", label: "編輯行程" },
  { href: "/buses", label: "車輛管理" },
  { href: "/leaders", label: "領隊管理" },
  { href: "/passengers", label: "人員管理" },
  { href: "/seating", label: "排車" },
];

/**
 * 行程專屬子頁共用的頂部區塊(行程名稱/日期/狀態 + 分頁導覽),
 * 讓使用者在各管理頁之間切換不用每次都回行程列表重選。
 */
export default function TripLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const access = useTripAccess(tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(getDb(), "trips", tripId), (snap) => {
      if (snap.exists()) setTrip(snap.data() as Trip);
    });
    return () => unsub();
  }, [tripId]);

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

  const basePath = `/trips/${tripId}`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/trips" className="text-xs text-gray-400 hover:text-gray-600">
          ← 行程列表
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">{trip.name}</h1>
            <p className="text-sm text-gray-400">
              {trip.date} ・ {trip.busCount} 台車
            </p>
            {!role?.globalSuperLead && (
              <p className="mt-1 text-xs text-brand-700">
                你的身分:{tripRoleSummary(role, tripId) ?? "尚無此行程角色"}
              </p>
            )}
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
      </div>

      {access.isSuperLead && (
        <nav className="flex flex-wrap items-center gap-1 border-b border-gray-200">
          {TABS.filter((tab) => tab.href !== "/edit" || trip.status !== "archived").map((tab) => {
            const href = `${basePath}${tab.href}`;
            const active = pathname === href;
            return (
              <Link
                key={tab.href}
                href={href}
                className={clsx(
                  "border-b-2 px-3 py-2 text-sm",
                  active
                    ? "border-brand-600 font-medium text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
          {role?.globalSuperLead && (
            <button onClick={() => setShowDeleteDialog(true)} className="ml-auto px-3 py-2 text-sm text-red-600">
              刪除行程
            </button>
          )}
        </nav>
      )}

      <BroadcastPanel tripId={tripId} canSend={access.isSuperLead} />

      {children}

      {showDeleteDialog && (
        <DeleteTripDialog
          tripName={trip.name}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
