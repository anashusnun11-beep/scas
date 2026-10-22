"use client";

import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { Input, Select } from "@/components/ui/field";
import type { ListQuery } from "@/server/queries/admin";

/** How long typing has to pause before the list updates, so a search doesn't run on every key. */
const SEARCH_DELAY_MS = 300;

/**
 * Search + status filter for the admin lists (FR14, FR15). Results follow as you type and the status
 * filter applies on change; both stay in the URL (?q=&status=) and the page goes back to 1.
 * Still a plain GET form underneath: before JavaScript loads, Enter submits it.
 */
export function ListToolbar({ query, placeholder, action }: { query: ListQuery; placeholder: string; action: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function apply() {
    const data = new FormData(formRef.current!);
    const q = String(data.get("q") ?? "").trim();
    const status = String(data.get("status") ?? "ACTIVE");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "ACTIVE") params.set("status", status);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function applySoon() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(apply, SEARCH_DELAY_MS);
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <form
        ref={formRef}
        method="get"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          window.clearTimeout(timer.current);
          apply();
        }}
        className="flex min-w-0 flex-1 flex-wrap items-end gap-2"
      >
        <label className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Search</span>
          {pending ? (
            <CircleNotchIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted motion-reduce:animate-none" />
          ) : (
            <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          )}
          <Input name="q" type="search" defaultValue={query.q} placeholder={placeholder} onChange={applySoon} className="pl-10" />
        </label>
        <label className="w-40">
          <span className="sr-only">Account status</span>
          <Select name="status" defaultValue={query.status} onChange={apply}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </Select>
        </label>
      </form>
      {action}
    </div>
  );
}
