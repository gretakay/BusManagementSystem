"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-500">載入中…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/trips" className="font-semibold">
            遊覽車點名系統
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{user.email}</span>
            {role?.globalSuperLead && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                總負責人
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
