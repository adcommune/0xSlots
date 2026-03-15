"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // clamp page when items shrink or pageSize changes
  const safePage = Math.min(page, totalPages - 1);

  const paged = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize],
  );

  const changePageSize = useCallback(
    (size: number) => {
      // keep the first visible item roughly in view
      const firstIndex = safePage * pageSize;
      setPageSize(size);
      setPage(Math.floor(firstIndex / size));
    },
    [safePage, pageSize],
  );

  return { page: safePage, setPage, pageSize, setPageSize: changePageSize, totalPages, paged };
}

export function TablePagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  if (total === 0) return null;

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-transparent border rounded px-1 py-0.5 text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-3" /> Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
