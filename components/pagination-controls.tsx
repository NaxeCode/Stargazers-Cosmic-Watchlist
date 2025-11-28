"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Params = Record<string, string | string[] | undefined>;

export function PaginationControls({
  page,
  totalPages,
  params,
  pageSize = 10,
}: {
  page: number;
  totalPages: number;
  params: Params;
  pageSize?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changePage = (targetPage: number, nextPageSize?: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "page" || key === "pageSize") return;
      if (Array.isArray(value)) {
        value.forEach((v) => search.append(key, v));
      } else if (value) {
        search.set(key, value);
      }
    });
    search.set("page", String(targetPage));
    if (nextPageSize) search.set("pageSize", String(nextPageSize));
    startTransition(() => {
      router.push(`/?${search.toString()}`, { scroll: false });
    });
  };

  const windowed = buildPageWindow(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <div>
        Page {page} of {totalPages}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || pending}
          onClick={() => changePage(page - 1)}
        >
          Prev
        </Button>
        {windowed.map((entry, idx) =>
          entry === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === page ? "default" : "ghost"}
              size="sm"
              className={`h-8 w-8 rounded-lg px-0 ${entry === page ? "pointer-events-none" : ""}`}
              disabled={pending}
              onClick={() => changePage(entry)}
            >
              {entry}
            </Button>
          ),
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages || pending}
          onClick={() => changePage(page + 1)}
        >
          Next
        </Button>
        <Select value={String(pageSize)} onValueChange={(v) => changePage(1, Number(v))}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder="Entries" />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 75, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function buildPageWindow(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "…"> = [];
  const add = (n: number | "…") => pages.push(n);

  add(1);
  if (current > 3) add("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) add(i);

  if (current < total - 2) add("…");
  add(total);

  return pages;
}
