"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiFetch } from "@/lib/api/client";
import type { AccountListItem } from "@/app/api/accounts/route";

export default function AccountsPage() {
  const { role } = useAuth();

  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<{ uid: string; email: string | null } | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function loadAccounts() {
    setLoading(true);
    try {
      const list = await apiFetch<AccountListItem[]>("/api/accounts");
      setAccounts(list);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role?.globalSuperLead) loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role?.globalSuperLead]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await apiFetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setEmail("");
      setPassword("");
      await loadAccounts();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setCreating(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    setResetSubmitting(true);
    try {
      await apiFetch(`/api/accounts/${resetTarget.uid}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      alert(`已重設 ${resetTarget.email ?? resetTarget.uid} 的密碼,請把新密碼告訴對方。`);
      setResetTarget(null);
      setResetPasswordValue("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "重設失敗");
    } finally {
      setResetSubmitting(false);
    }
  }

  if (!role?.globalSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限管理帳號。</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">帳號管理</h1>
      <p className="text-sm text-gray-500">
        在這裡先建立帳號、設定密碼,之後就可以到各行程的「領隊管理」用 email 把帳號加入行程,不用再重複輸入密碼。
      </p>

      {resetTarget && (
        <form
          onSubmit={handleResetPassword}
          className="space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-4"
        >
          <p className="text-sm font-medium">為 {resetTarget.email ?? resetTarget.uid} 設定新密碼</p>
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

      <form onSubmit={handleCreate} className="grid max-w-lg gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-500">新增帳號</h2>
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="text"
          placeholder="密碼(至少6碼)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {createError && <p className="text-sm text-red-600">{createError}</p>}
        <button
          type="submit"
          disabled={creating}
          className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {creating ? "建立中…" : "建立帳號"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">所有帳號</h2>
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-400">尚無帳號。</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {accounts.map((acc) => (
              <li key={acc.uid} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{acc.email ?? acc.uid}</span>
                <button
                  onClick={() => {
                    setResetTarget({ uid: acc.uid, email: acc.email });
                    setResetPasswordValue("");
                    setResetError(null);
                  }}
                  className="text-sm text-brand-600"
                >
                  重設密碼
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
