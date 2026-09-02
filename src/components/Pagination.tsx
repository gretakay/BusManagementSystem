"use client";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-3 text-sm">
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
