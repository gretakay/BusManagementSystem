"use client";

interface InlineLoadErrorProps {
  message?: string;
  onRetry: () => void;
  variant?: "block" | "banner";
}

/**
 * Firestore 監聽重試耗盡後的統一錯誤畫面:block 用在整頁只有這筆資料可顯示的情境
 * (取代原本會卡住的「載入中…」或誤顯示成空清單);banner 用在頁面其他部分仍可操作的情境。
 */
export function InlineLoadError({ message = "無法載入資料,請重試。", onRetry, variant = "block" }: InlineLoadErrorProps) {
  if (variant === "banner") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
        <span>⚠ {message}</span>
        <button
          onClick={onRetry}
          className="shrink-0 rounded-md border border-amber-300 px-2 py-1 text-xs font-medium text-amber-700"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
      >
        重試
      </button>
    </div>
  );
}
