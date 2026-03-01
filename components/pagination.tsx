"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
}

export function Pagination({ currentPage, totalPages, totalCount, pageSize = 10 }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = totalCount ? Math.min(currentPage * pageSize, totalCount) : currentPage * pageSize;

  return (
    <nav className="mt-6 flex items-center justify-between">
      {/* Count info */}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {totalCount
          ? `총 ${totalCount}개 파일 중 ${from}-${to}`
          : `페이지 ${currentPage} / ${totalPages}`}
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-base"
            style={
              page === currentPage
                ? { backgroundColor: "var(--accent-primary)", color: "#FFFFFF" }
                : { color: "var(--text-secondary)", border: "1px solid var(--border)" }
            }
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
