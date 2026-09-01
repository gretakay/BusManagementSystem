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

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <h2 className="text-sm font-medium text-amber-800">廣播訊息</h2>
      {broadcasts.length > 0 && (
        <ul className="space-y-1.5">
          {broadcasts.map((b) => (
            <li key={b.id} className="text-sm text-amber-900">
              <p>{b.message}</p>
              <p className="text-xs text-amber-600">
                {new Date(b.createdAt).toLocaleString("zh-TW", { hour12: false })}
                {b.createdByEmail ? ` ・ ${b.createdByEmail}` : ""}
              </p>
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
