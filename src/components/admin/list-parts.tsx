import { CaretLeftIcon, CaretRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { PAGE_SIZE, type ListQuery } from "@/server/queries/admin";

export { AccountChip } from "./account-chip";

/** Search + status filter. A plain GET form: works before JavaScript loads and keeps the query in the URL. */
export function ListToolbar({ query, placeholder, action }: { query: ListQuery; placeholder: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <form method="get" role="search" className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
        <label className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Search</span>
          <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input name="q" type="search" defaultValue={query.q} placeholder={placeholder} className="pl-10" />
        </label>
        <label className="w-40">
          <span className="sr-only">Account status</span>
          <Select name="status" defaultValue={query.status}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </Select>
        </label>
        <button type="submit" className={buttonClasses({ variant: "secondary" })}>
          Search
        </button>
      </form>
      {action}
    </div>
  );
}

/** "21-40 of 57" with previous / next links that keep the search. */
export function Pager({ query, total, basePath }: { query: ListQuery; total: number; basePath: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total === 0) return null;
  const href = (page: number) => {
    const p = new URLSearchParams();
    if (query.q) p.set("q", query.q);
    if (query.status !== "ACTIVE") p.set("status", query.status);
    if (page > 1) p.set("page", String(page));
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = (query.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, query.page * PAGE_SIZE);
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-muted">
      <span>
        {from}-{to} of {total}
      </span>
      {pages > 1 && (
        <span className="flex gap-2">
          {query.page > 1 ? (
            <Link href={href(query.page - 1)} className={buttonClasses({ variant: "secondary", size: "sm" })} aria-label="Previous page">
              <CaretLeftIcon aria-hidden className="size-4" />
            </Link>
          ) : null}
          {query.page < pages ? (
            <Link href={href(query.page + 1)} className={buttonClasses({ variant: "secondary", size: "sm" })} aria-label="Next page">
              <CaretRightIcon aria-hidden className="size-4" />
            </Link>
          ) : null}
        </span>
      )}
    </nav>
  );
}
