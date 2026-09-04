"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { globalSuperLeadLabel } from "@/types/role";
import { OnlineStatusBanner } from "@/components/OnlineStatusBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, roleLoading, roleError, retryRole, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || roleLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">載入中…</div>;
  }

  if (roleError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-gray-500">
        <p>無法載入你的權限資料,請檢查網路連線。</p>
        <button
          onClick={retryRole}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          重試
        </button>
      </div>
    );
  }

  const displayLabel = role?.displayName ? `${role.displayName}(${user.email})` : (user.email ?? "");

  return (
    <div className="min-h-screen">
      <OnlineStatusBanner />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/trips" className="font-semibold" onClick={() => setMenuOpen(false)}>
            遊覽車點名系統
          </Link>

          <div className="hidden items-center gap-3 text-sm text-gray-600 sm:flex">
            {role?.globalSuperLead && (
              <Link href="/accounts" className="text-brand-600">
                帳號管理
              </Link>
            )}
            {role?.globalSuperLead && (
              <Link href="/audit" className="text-brand-600">
                操作紀錄
              </Link>
            )}
            <span className="max-w-[12rem] truncate" title={displayLabel}>
              {displayLabel}
            </span>
            {role?.globalSuperLead && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                {globalSuperLeadLabel(role)}
              </span>
            )}
            <button onClick={() => signOut()} className="text-gray-400 hover:text-gray-700">
              登出
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 sm:hidden"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{displayLabel}</span>
              {role?.globalSuperLead && (
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                  {globalSuperLeadLabel(role)}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {role?.globalSuperLead && (
                <Link href="/accounts" className="text-brand-600" onClick={() => setMenuOpen(false)}>
                  帳號管理
                </Link>
              )}
              {role?.globalSuperLead && (
                <Link href="/audit" className="text-brand-600" onClick={() => setMenuOpen(false)}>
                  操作紀錄
                </Link>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="text-left text-gray-400 hover:text-gray-700"
              >
                登出
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
