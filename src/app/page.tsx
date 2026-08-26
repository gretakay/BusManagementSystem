"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/trips" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-500">載入中…</div>
  );
}
