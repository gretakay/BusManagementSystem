"use client";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  edge = "bottom",
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** 分隔線要靠哪一側,配合放置位置(清單上方用 top、下方用 bottom) */
  edge?: "top" | "bottom";
}) {
  if (pageCount <= 1) return null;

  return (
    <div
      className={`flex items-center justify-center gap-3 px-4 py-3 text-sm ${
        edge === "top" ? "border-b border-gray-100" : "border-t border-gray-100"
      }`}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
      >
        上一頁
      </button>
      <span className="text-gray-500">
        第 {page} / {pageCount} 頁
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
      >
        下一頁
      </button>
    </div>
  );
}
