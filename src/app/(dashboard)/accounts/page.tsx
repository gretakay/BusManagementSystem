"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiFetch } from "@/lib/api/client";
import { Pagination } from "@/components/Pagination";
import type { AccountListItem } from "@/app/api/accounts/route";
import type { GlobalAccessLevel, GlobalSuperLeadTitle } from "@/types/role";

const PAGE_SIZE = 50;

export default function AccountsPage() {
  const { role, user } = useAuth();

  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<{ uid: string; email: string | null } | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [profileTarget, setProfileTarget] = useState<AccountListItem | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileLoginPhone, setProfileLoginPhone] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  /** 目前展開「授予全域權限」表單的帳號 uid;大部分帳號預設沒有全域權限,平常收合,避免看起來每個帳號都要設定。 */
  const [grantExpandedUid, setGrantExpandedUid] = useState<string | null>(null);

  /** 每個帳號在「授予/調整全域權限」表單裡目前選的稱謂/權限等級,預設沿用該帳號現有設定或初始值。 */
  const [roleDrafts, setRoleDrafts] = useState<Record<string, { title: GlobalSuperLeadTitle; level: GlobalAccessLevel }>>(
    {},
  );

  function getRoleDraft(acc: AccountListItem) {
    return (
      roleDrafts[acc.uid] ?? {
        title: acc.globalSuperLeadTitle ?? "總負責人",
        level: acc.globalAccessLevel ?? "full",
      }
    );
  }

  function setRoleDraft(acc: AccountListItem, patch: Partial<{ title: GlobalSuperLeadTitle; level: GlobalAccessLevel }>) {
    setRoleDrafts((prev) => ({ ...prev, [acc.uid]: { ...getRoleDraft(acc), ...patch } }));
  }

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
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
          loginPhone: loginPhone || undefined,
        }),
      });
      setEmail("");
      setPassword("");
      setDisplayName("");
      setLoginPhone("");
      await loadAccounts();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profileTarget) return;
    setProfileError(null);
    setProfileSubmitting(true);
    try {
      await apiFetch(`/api/accounts/${profileTarget.uid}/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: profileDisplayName || undefined,
          loginPhone: profileLoginPhone || undefined,
        }),
      });
      setProfileTarget(null);
      await loadAccounts();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "設定失敗");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handleSetGlobalRole(acc: AccountListItem, title: GlobalSuperLeadTitle, level: GlobalAccessLevel) {
    const levelLabel = level === "readOnly" ? "唯讀(只能檢視所有行程,不能新增/編輯/指派/點名)" : "完整管理";
    const confirmMsg = `確定要將 ${acc.email ?? acc.uid} 設為「${title}」・${levelLabel}嗎?`;
    if (!confirm(confirmMsg)) return;
    setTogglingUid(acc.uid);
    try {
      await apiFetch(`/api/accounts/${acc.uid}/role`, {
        method: "PATCH",
        body: JSON.stringify({ globalSuperLead: true, title, accessLevel: level }),
      });
      setGrantExpandedUid(null);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "設定失敗");
    } finally {
      setTogglingUid(null);
    }
  }

  async function handleRevokeGlobalRole(acc: AccountListItem) {
    if (!confirm(`確定要收回 ${acc.email ?? acc.uid} 的${acc.globalSuperLeadTitle ?? "總負責人"}權限嗎?`)) return;
    setTogglingUid(acc.uid);
    try {
      await apiFetch(`/api/accounts/${acc.uid}/role`, {
        method: "PATCH",
        body: JSON.stringify({ globalSuperLead: false }),
      });
      setGrantExpandedUid(null);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "設定失敗");
    } finally {
      setTogglingUid(null);
    }
  }

  async function handleDeleteAccount(acc: AccountListItem) {
    const label = acc.displayName ? `${acc.displayName}(${acc.email})` : (acc.email ?? acc.uid);
    if (
      !confirm(
        `確定要永久刪除帳號「${label}」嗎?這個人將無法再登入,此操作無法復原。\n(過去行程的領隊指派紀錄會保留,不受影響)`,
      )
    )
      return;
    setDeletingUid(acc.uid);
    try {
      await apiFetch(`/api/accounts/${acc.uid}`, { method: "DELETE" });
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeletingUid(null);
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

  const filteredAccounts = accounts.filter((acc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (acc.email ?? "").toLowerCase().includes(q) ||
      (acc.displayName ?? "").toLowerCase().includes(q) ||
      (acc.loginPhone ?? "").includes(search)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const pagedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

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

      {profileTarget && (
        <form
          onSubmit={handleSaveProfile}
          className="space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-4"
        >
          <p className="text-sm font-medium">設定 {profileTarget.email ?? profileTarget.uid} 的顯示名稱/登入手機</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="顯示名稱(例如真實姓名)"
              value={profileDisplayName}
              onChange={(e) => setProfileDisplayName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="登入手機號碼(選填,09 開頭共 10 碼)"
              value={profileLoginPhone}
              onChange={(e) => setProfileLoginPhone(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={profileSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {profileSubmitting ? "儲存中…" : "儲存"}
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileTarget(null);
                setProfileError(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm"
            >
              取消
            </button>
          </div>
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
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
        <input
          type="text"
          placeholder="顯示名稱(選填,例如真實姓名,方便辨識是誰)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="登入手機號碼(選填,登入時可以打這個代替 Email)"
          value={loginPhone}
          onChange={(e) => setLoginPhone(e.target.value)}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-gray-500">
            所有帳號({filteredAccounts.length}
            {filteredAccounts.length !== accounts.length ? ` / 共 ${accounts.length}` : ""})
          </h2>
          <input
            placeholder="搜尋 Email、名稱或手機號碼"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} edge="top" />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : filteredAccounts.length === 0 ? (
          <p className="text-sm text-gray-400">{accounts.length === 0 ? "尚無帳號。" : "沒有符合條件的帳號。"}</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {pagedAccounts.map((acc) => (
              <li key={acc.uid} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {acc.displayName ? (
                      <>
                        <span className="font-medium">{acc.displayName}</span>
                        <span className="ml-1 text-xs text-gray-400">{acc.email}</span>
                      </>
                    ) : (
                      acc.email ?? acc.uid
                    )}
                    {acc.loginPhone && <span className="ml-1 text-xs text-gray-400">・{acc.loginPhone}</span>}
                  </span>
                  {acc.globalSuperLead ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                      {acc.globalSuperLeadTitle ?? "總負責人"}
                      {acc.globalAccessLevel === "readOnly" ? "・唯讀" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">無全域權限(僅按行程指派)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {acc.globalSuperLead || grantExpandedUid === acc.uid ? (
                    <>
                      <select
                        value={getRoleDraft(acc).title}
                        onChange={(e) => setRoleDraft(acc, { title: e.target.value as GlobalSuperLeadTitle })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="總負責人">總負責人</option>
                        <option value="法師">法師</option>
                      </select>
                      <select
                        value={getRoleDraft(acc).level}
                        onChange={(e) => setRoleDraft(acc, { level: e.target.value as GlobalAccessLevel })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="full">完整管理</option>
                        <option value="readOnly">唯讀</option>
                      </select>
                      <button
                        onClick={() => handleSetGlobalRole(acc, getRoleDraft(acc).title, getRoleDraft(acc).level)}
                        disabled={
                          togglingUid === acc.uid || (getRoleDraft(acc).level === "readOnly" && acc.uid === user?.uid)
                        }
                        className="text-sm text-brand-600 disabled:opacity-40"
                        title={
                          getRoleDraft(acc).level === "readOnly" && acc.uid === user?.uid
                            ? "無法把自己的權限降為唯讀"
                            : undefined
                        }
                      >
                        {togglingUid === acc.uid ? "處理中…" : acc.globalSuperLead ? "套用" : "授予"}
                      </button>
                      {acc.globalSuperLead ? (
                        <button
                          onClick={() => handleRevokeGlobalRole(acc)}
                          disabled={togglingUid === acc.uid || acc.uid === user?.uid}
                          className="text-sm text-red-500 disabled:opacity-40"
                          title={acc.uid === user?.uid ? "無法收回自己的權限" : undefined}
                        >
                          收回權限
                        </button>
                      ) : (
                        <button onClick={() => setGrantExpandedUid(null)} className="text-sm text-gray-400">
                          取消
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => setGrantExpandedUid(acc.uid)} className="text-sm text-brand-600">
                      授予全域權限
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setProfileTarget(acc);
                      setProfileDisplayName(acc.displayName ?? "");
                      setProfileLoginPhone(acc.loginPhone ?? "");
                      setProfileError(null);
                    }}
                    className="text-sm text-brand-600"
                  >
                    編輯名稱/手機
                  </button>
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
                  <button
                    onClick={() => handleDeleteAccount(acc)}
                    disabled={deletingUid === acc.uid || acc.uid === user?.uid}
                    className="text-sm text-red-600 disabled:opacity-40"
                    title={acc.uid === user?.uid ? "無法刪除自己的帳號" : undefined}
                  >
                    {deletingUid === acc.uid ? "刪除中…" : "刪除"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
