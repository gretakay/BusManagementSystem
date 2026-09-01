"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import type { Broadcast } from "@/types/broadcast";

const VISIBLE_LIMIT = 3;

/**
 * 規格書 §5.4:總領隊/師父對此行程所有領隊廣播訊息(例如集合地點異動、天候通知)。
 * 放在行程共用版面裡,不管在哪個子頁都看得到最新訊息,不用另外找地方查看。
 */
export function BroadcastPanel({ tripId, canSend }: { tripId: string; canSend: boolean }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(getDb(), "trips", tripId, "broadcasts"),
      orderBy("createdAt", "desc"),
      limit(VISIBLE_LIMIT),
    );
    const unsub = onSnapshot(q, (snap) => setBroadcasts(snap.docs.map((d) => d.data() as Broadcast)));
    return () => unsub();
  }, [tripId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setError(null);
    setSending(true);
    try {
      await apiFetch(`/api/trips/${tripId}/broadcasts`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "發送失敗");
    } finally {
      setSending(false);
    }
  }

  if (!canSend && broadcasts.length === 0) return null;

  const [latest, ...older] = broadcasts;

  return (
    <div className="space-y-2 rounded-lg border-2 border-amber-400 bg-amber-100 p-3 shadow-sm">
      <h2 className="flex items-center gap-1 text-sm font-bold text-amber-900">📢 廣播訊息</h2>
      {latest && (
        <div className="rounded-md border border-amber-300 bg-white px-3 py-2">
          <p className="text-base font-bold text-amber-900">{latest.message}</p>
          <p className="mt-0.5 text-xs text-amber-600">
            {new Date(latest.createdAt).toLocaleString("zh-TW", { hour12: false })}
            {latest.createdByEmail ? ` ・ ${latest.createdByEmail}` : ""}
          </p>
        </div>
      )}
      {older.length > 0 && (
        <ul className="space-y-1 border-t border-amber-200 pt-1.5">
          {older.map((b) => (
            <li key={b.id} className="text-xs text-amber-700">
              {b.message}
              <span className="ml-2 text-amber-500">
                {new Date(b.createdAt).toLocaleString("zh-TW", { hour12: false })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canSend && (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            placeholder="例如:集合地點改到正門口"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {sending ? "發送中…" : "發送廣播"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
