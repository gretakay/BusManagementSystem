"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import type { Bus } from "@/types/bus";
import type { BusRole } from "@/types/role";
import type { Trip } from "@/types/trip";
import type { AccountListItem } from "@/app/api/accounts/route";

const ROLE_LABELS: Record<BusRole, string> = {
  leader: "領隊",
  coLeader: "副領隊",
  groupLeader: "小組長",
};

export default function TripLeadersPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { role: authRole } = useAuth();
  const access = useTripAccess(tripId);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [accountEmails, setAccountEmails] = useState<string[]>([]);
  const [busId, setBusId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<BusRole>("leader");
  const [groupTag, setGroupTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [superLeadEmail, setSuperLeadEmail] = useState("");
  const [superLeadPassword, setSuperLeadPassword] = useState("");
  const [superLeadSubmitting, setSuperLeadSubmitting] = useState(false);
  const [superLeadError, setSuperLeadError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<{ uid: string; email: string } | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!authRole?.globalSuperLead) return;
    apiFetch<AccountListItem[]>("/api/accounts")
      .then((list) => setAccountEmails(list.map((a) => a.email).filter((e): e is string => Boolean(e))))
      .catch(() => setAccountEmails([]));
  }, [authRole?.globalSuperLead]);

  /**
   * Email 自動完成建議清單:全域總負責人可看到所有帳號(來自 /api/accounts);
   * 行程專屬總領隊沒有那個權限,但這個行程裡已經指派過的人(總領隊/各車領隊)本來就看得到,
   * 所以額外把這些人的 email 也加進建議清單,一樣能避免重複輸入,又不會洩漏行程外的帳號清單。
   */
  const emailSuggestions = useMemo(() => {
    const set = new Set(accountEmails);
    for (const s of trip?.superLeads ?? []) set.add(s.email);
    for (const b of buses) {
      for (const l of b.leaders) set.add(l.email);
    }
    return Array.from(set).sort();
  }, [accountEmails, trip, buses]);

  useEffect(() => {
    const q = query(collection(getDb(), "trips", tripId, "buses"), orderBy("busNumber"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as Bus);
      setBuses(list);
      setBusId((prev) => (prev && list.some((b) => b.id === prev) ? prev : (list[0]?.id ?? "")));
    });
    return () => unsub();
  }, [tripId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(getDb(), "trips", tripId), (snap) => {
      if (snap.exists()) setTrip(snap.data() as Trip);
    });
    return () => unsub();
  }, [tripId]);

  async function handleAssignSuperLead(e: FormEvent) {
    e.preventDefault();
    setSuperLeadError(null);
    setSuperLeadSubmitting(true);
    try {
      await apiFetch(`/api/trips/${tripId}/superleads`, {
        method: "POST",
        body: JSON.stringify({ email: superLeadEmail, password: superLeadPassword || undefined }),
      });
      setSuperLeadEmail("");
      setSuperLeadPassword("");
    } catch (err) {
      setSuperLeadError(err instanceof Error ? err.message : "指派失敗");
    } finally {
      setSuperLeadSubmitting(false);
    }
  }

  async function handleRemoveSuperLead(uid: string) {
    if (!confirm("確定移除此總領隊指派？")) return;
    try {
      await apiFetch(`/api/trips/${tripId}/superleads`, {
        method: "DELETE",
        body: JSON.stringify({ uid }),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "移除失敗");
    }
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    if (!busId) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/api/trips/${tripId}/buses/${busId}/leaders`, {
        method: "POST",
        body: JSON.stringify({ email, role, password: password || undefined, groupTag: groupTag || undefined }),
      });
      setEmail("");
      setPassword("");
      setGroupTag("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "指派失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(targetBusId: string, uid: string) {
    if (!confirm("確定移除此指派？")) return;
    try {
      await apiFetch(`/api/trips/${tripId}/buses/${targetBusId}/leaders`, {
        method: "DELETE",
        body: JSON.stringify({ uid }),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "移除失敗");
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    setResetSubmitting(true);
    try {
      await apiFetch(`/api/trips/${tripId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ uid: resetTarget.uid, password: resetPasswordValue }),
      });
      alert(`已重設 ${resetTarget.email} 的密碼,請把新密碼告訴對方。`);
      setResetTarget(null);
      setResetPasswordValue("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "重設失敗");
    } finally {
      setResetSubmitting(false);
    }
  }

  if (!access.isSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限管理此行程的領隊指派。</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">領隊管理</h1>
      <p className="text-sm text-gray-500">
        指派各車輛的領隊/副領隊/小組長,以及此行程的總領隊。對方如果還沒有帳號,填密碼欄位即可順便建立;已有帳號的話密碼留空即可。
      </p>

      <datalist id="account-emails">
        {emailSuggestions.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      {resetTarget && (
        <form
          onSubmit={handleResetPassword}
          className="space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-4"
        >
          <p className="text-sm font-medium">為 {resetTarget.email} 設定新密碼</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              required
              type="text"
              placeholder="新密碼(至少6碼)"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={resetSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {resetSubmitting ? "設定中…" : "確認重設"}
            </button>
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPasswordValue("");
                setResetError(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm"
            >
              取消
            </button>
          </div>
          {resetError && <p className="text-sm text-red-600">{resetError}</p>}
        </form>
      )}

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-500">
          此行程的總領隊(可管理整個行程,包含指派其他領隊)
        </h2>
        <form onSubmit={handleAssignSuperLead} className="flex flex-wrap items-center gap-2">
          <input
            required
            type="email"
            list="account-emails"
            placeholder="要指派為總領隊的 Email"
            value={superLeadEmail}
            onChange={(e) => setSuperLeadEmail(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="密碼(對方還沒帳號才需填,至少6碼)"
            value={superLeadPassword}
            onChange={(e) => setSuperLeadPassword(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={superLeadSubmitting}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {superLeadSubmitting ? "指派中…" : "新增總領隊"}
          </button>
        </form>
        {superLeadError && <p className="text-sm text-red-600">{superLeadError}</p>}
        <ul className="flex flex-wrap gap-2">
          {(trip?.superLeads ?? []).length === 0 ? (
            <li className="text-sm text-gray-400">
              尚未指派此行程專屬的總領隊(目前只有全域總負責人可管理)
            </li>
          ) : (
            (trip?.superLeads ?? []).map((s) => (
              <li
                key={s.uid}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
              >
                {s.email}
                <button
                  onClick={() => {
                    setResetTarget({ uid: s.uid, email: s.email });
                    setResetPasswordValue("");
                    setResetError(null);
                  }}
                  className="text-gray-400 hover:text-brand-600"
                >
                  重設密碼
                </button>
                <button onClick={() => handleRemoveSuperLead(s.uid)} className="text-gray-400 hover:text-red-500">
                  ×
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <form onSubmit={handleAssign} className="grid max-w-lg gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-500">新增車輛領隊/副領隊/小組長指派</h2>
        <div className="grid grid-cols-2 gap-3">
          <select
            required
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {buses.length === 0 && <option value="">尚無車輛</option>}
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.busNumber}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as BusRole)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {(Object.keys(ROLE_LABELS) as BusRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <input
          required
          type="email"
          list="account-emails"
          placeholder="要指派人員的 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="密碼(對方還沒帳號才需填,至少6碼)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="只負責的組別(選填,例如小客車車號;留空 = 整台車都看得到)"
          value={groupTag}
          onChange={(e) => setGroupTag(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !busId}
          className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "指派中…" : "新增指派"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">目前指派總覽</h2>
        {buses.length === 0 ? (
          <p className="text-sm text-gray-400">尚無車輛,請先到車輛管理新增。</p>
        ) : (
          <ul className="space-y-3">
            {buses.map((bus) => (
              <li key={bus.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="font-medium">{bus.busNumber}</p>
                {bus.leaders.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-400">尚未指派任何人</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {bus.leaders.map((l) => (
                      <li
                        key={l.uid}
                        className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        {ROLE_LABELS[l.role]}
                        {l.groupTag ? `(${l.groupTag})` : ""}:{l.email}
                        <button
                          onClick={() => {
                            setResetTarget({ uid: l.uid, email: l.email });
                            setResetPasswordValue("");
                            setResetError(null);
                          }}
                          className="text-gray-400 hover:text-brand-600"
                        >
                          重設密碼
                        </button>
                        <button
                          onClick={() => handleRemove(bus.id, l.uid)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
