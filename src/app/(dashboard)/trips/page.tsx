"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiFetch } from "@/lib/api/client";
import { useRetryToken } from "@/lib/firebase/onSnapshotWithRetry";
import { InlineLoadError } from "@/components/InlineLoadError";
import { TripStatusBadge } from "@/components/trip/TripStatusBadge";
import { DeleteTripDialog } from "@/components/trip/DeleteTripDialog";
import { isTripSuperLead, tripRoleSummary } from "@/types/role";
import type { Trip } from "@/types/trip";

export default function TripsPage() {
  const { role } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, retry] = useRetryToken();
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/trips/${deleteTarget.id}`, { method: "DELETE" });
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    apiFetch<Trip[]>("/api/trips")
      .then((list) => {
        if (cancelled) return;
        setTrips(list);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">行程列表</h1>
        {role?.globalSuperLead && (
          <Link
            href="/trips/new"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            + 建立行程
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : loadError ? (
        <InlineLoadError onRetry={retry} />
      ) : trips.length === 0 ? (
        <p className="text-sm text-gray-400">尚無可查看的行程。</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {trips.map((trip) => (
            <li key={trip.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <Link href={`/trips/${trip.id}`} className="flex-1">
                <p className="font-medium">{trip.name}</p>
                <p className="text-xs text-gray-400">
                  {trip.date} ・ {trip.busCount} 台車
                </p>
                {!role?.globalSuperLead && (
                  <p className="text-xs text-brand-700">你的身分:{tripRoleSummary(role, trip.id)}</p>
                )}
              </Link>
              <div className="flex items-center gap-3">
                <TripStatusBadge status={trip.status} />
                {trip.status !== "archived" && isTripSuperLead(role, trip.id) && (
                  <Link href={`/trips/${trip.id}/edit`} className="text-xs text-brand-600">
                    編輯
                  </Link>
                )}
                {role?.globalSuperLead && (
                  <button onClick={() => setDeleteTarget(trip)} className="text-xs text-red-600">
                    刪除
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget && (
        <DeleteTripDialog
          tripName={deleteTarget.name}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
