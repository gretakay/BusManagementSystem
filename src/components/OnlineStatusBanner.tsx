"use client";

import { useEffect, useState } from "react";

/**
 * Firestore 已開離線持久化(見 lib/firebase/client.ts),點名寫入離線時會暫存、恢復連線後自動同步,
 * 但使用者看不出目前是不是離線、操作是不是真的還沒送到伺服器,所以加一個簡單的連線狀態提示。
 */
export function OnlineStatusBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-white">
      ⚠ 目前離線中,點名操作會先暫存,恢復連線後自動同步;需要即時查詢的功能(例如掃到別車/別組的提示)可能無法使用。
    </div>
  );
}
