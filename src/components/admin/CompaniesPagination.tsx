"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function CompaniesPagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const navigate = (p: number) => {
    startTransition(() => {
      router.push(buildHref(p));
    });
  };

  // Build visible page numbers: always show first, last, current ±1
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [1];

    if (page > 3) pages.push("ellipsis");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div
      className={
        isPending ? "opacity-50 pointer-events-none transition-opacity" : ""
      }
    >
      <Pagination>
        <PaginationContent>
          {/* Previous */}
          <PaginationItem>
            <PaginationPrevious
              href={buildHref(page - 1)}
              onClick={(e) => {
                e.preventDefault();
                if (hasPrev) navigate(page - 1);
              }}
              aria-disabled={!hasPrev}
              className={!hasPrev ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {/* Page numbers */}
          {getPageNumbers().map((p, i) =>
            p === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href={buildHref(p)}
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          {/* Next */}
          <PaginationItem>
            <PaginationNext
              href={buildHref(page + 1)}
              onClick={(e) => {
                e.preventDefault();
                if (hasNext) navigate(page + 1);
              }}
              aria-disabled={!hasNext}
              className={!hasNext ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
