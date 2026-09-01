"use client";

import { useState } from "react";

/** 刪除行程是不可逆操作(連車輛/點名紀錄/乘客名單一併刪除),故要求輸入行程名稱才能確認,取代單次瀏覽器 confirm。 */
export function DeleteTripDialog({
  tripName,
  deleting,
  onConfirm,
  onCancel,
}: {
  tripName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const matched = input === tripName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm space-y-3 rounded-lg bg-white p-5 shadow-lg">
        <h2 className="text-sm font-semibold text-red-600">永久刪除行程</h2>
        <p className="text-sm text-gray-600">
          此操作會刪除「{tripName}」及其所有車輛、點名紀錄、乘客名單,且無法復原。請輸入行程名稱以確認:
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tripName}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matched || deleting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {deleting ? "刪除中…" : "確認永久刪除"}
          </button>
        </div>
      </div>
    </div>
  );
}
