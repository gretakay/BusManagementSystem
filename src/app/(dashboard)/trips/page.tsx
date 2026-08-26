"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TripStatusBadge } from "@/components/trip/TripStatusBadge";
import { isTripSuperLead } from "@/types/role";
import type { Trip } from "@/types/trip";

export default function TripsPage() {
  const { role } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(getDb(), "trips"), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => d.data() as Trip));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

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
              </Link>
              <div className="flex items-center gap-3">
                <TripStatusBadge status={trip.status} />
                {trip.status !== "archived" && isTripSuperLead(role, trip.id) && (
                  <Link href={`/trips/${trip.id}/edit`} className="text-xs text-brand-600">
                    編輯
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
