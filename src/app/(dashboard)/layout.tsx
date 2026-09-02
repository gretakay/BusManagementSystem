"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { globalSuperLeadLabel } from "@/types/role";
import { OnlineStatusBanner } from "@/components/OnlineStatusBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, roleLoading, roleError, retryRole, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen">
      <OnlineStatusBanner />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/trips" className="font-semibold">
            遊覽車點名系統
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-600">
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
            <span>{role?.displayName ? `${role.displayName}(${user.email})` : user.email}</span>
            {role?.globalSuperLead && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                {globalSuperLeadLabel(role)}
              </span>
            )}
            <button onClick={() => signOut()} className="text-gray-400 hover:text-gray-700">
              登出
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
