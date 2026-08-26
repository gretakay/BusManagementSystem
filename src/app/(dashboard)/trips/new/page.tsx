"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import type { Trip } from "@/types/trip";

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busCount, setBusCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const trip = await apiFetch<Trip>("/api/trips", {
        method: "POST",
        body: JSON.stringify({ name, date, busCount: Number(busCount) }),
      });
      router.replace(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">建立行程</h1>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "建立中…" : "建立行程"}
      </button>
    </form>
  );
}
