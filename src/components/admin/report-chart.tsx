"use client";

import { useState, type CSSProperties } from "react";
import { percent, REPORT_STATUSES, statusLabel, type ReportData, type ReportType, type StatusCounts } from "@/lib/reports";

/**
 * FR16 chart: horizontal bars, one row per lecturer (stacked by status) or per status.
 * - Bars grow from the baseline once (CSS `chart-bar`, instant under reduced motion, static in print).
 * - Fills use the validated --chart-* palette; text stays in ink / muted, never in the data colour.
 * - Hover or keyboard focus on a row shows its breakdown; each row also has a spoken summary.
 *   The table below is the full accessible twin.
 */
export function ReportChart({ type, data }: { type: ReportType; data: ReportData }) {
  const [active, setActive] = useState<string | null>(null);

  const rows =
    type === "BY_LECTURER"
      ? data.lecturers.map((l) => ({ key: l.lecturerId, label: l.name, note: l.inactive ? "(inactive)" : undefined, total: l.total, counts: l.counts }))
      : REPORT_STATUSES.map((s) => ({ key: s, label: statusLabel[s], note: undefined, total: data.counts[s], counts: only(s, data.counts[s]) }));
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <figure className="print-exact grid gap-5" aria-label="Appointment chart. The same figures are in the table below.">
      {type === "BY_LECTURER" && <Legend />}
      <ul className="grid gap-3.5">
        {rows.map((row, i) => {
          const open = active === row.key;
          // The bar may use the track minus room for the value at its tip.
          const width: CSSProperties = { width: `calc((100% - 4.5rem) * ${row.total / max})` };
          return (
            <li
              key={row.key}
              tabIndex={0}
              aria-label={spoken(row.label, row.counts, row.total)}
              onMouseEnter={() => setActive(row.key)}
              onMouseLeave={() => setActive((a) => (a === row.key ? null : a))}
              onFocus={() => setActive(row.key)}
              onBlur={() => setActive((a) => (a === row.key ? null : a))}
              className="group grid gap-1.5 rounded-chip outline-offset-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <span aria-hidden className="min-w-0 truncate text-sm font-medium text-ink">
                {row.label}
                {row.note && <span className="ml-1 font-normal text-muted">{row.note}</span>}
              </span>
              <div aria-hidden className="flex min-h-7 items-center gap-2 border-l border-line-strong">
                <div className="relative self-stretch" style={width}>
                  <div
                    className="chart-bar flex h-full max-h-6 min-h-5 gap-0.5 overflow-hidden rounded-r-mark"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {REPORT_STATUSES.map((s) =>
                      row.counts[s] > 0 ? <span key={s} className="h-full" style={{ flex: `${row.counts[s]} 0 0`, background: `var(--chart-${s.toLowerCase()})` }} /> : null,
                    )}
                  </div>
                  {open && row.total > 0 && <Tooltip title={row.label} counts={row.counts} total={row.total} showTotal={type === "BY_LECTURER"} />}
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                  {row.total}
                  {type === "BY_STATUS" && <span className="ml-1.5 font-normal text-muted">{percent(row.total, data.total)}</span>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function spoken(label: string, counts: StatusCounts, total: number) {
  const parts = REPORT_STATUSES.filter((s) => counts[s] > 0).map((s) => `${statusLabel[s]} ${counts[s]}`);
  return `${label}: ${total} appointment${total === 1 ? "" : "s"}${parts.length > 1 ? `, ${parts.join(", ")}` : ""}`;
}

function only(status: (typeof REPORT_STATUSES)[number], n: number): StatusCounts {
  return { PENDING: 0, APPROVED: 0, RESCHEDULED: 0, COMPLETED: 0, REJECTED: 0, CANCELLED: 0, [status]: n };
}

function Swatch({ status }: { status: (typeof REPORT_STATUSES)[number] }) {
  return <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ background: `var(--chart-${status.toLowerCase()})` }} />;
}

/** Always present for the stacked chart: identity never relies on colour alone. */
function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {REPORT_STATUSES.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <Swatch status={s} />
          {statusLabel[s]}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ title, counts, total, showTotal }: { title: string; counts: StatusCounts; total: number; showTotal: boolean }) {
  const shown = REPORT_STATUSES.filter((s) => counts[s] > 0);
  return (
    <div className="pointer-events-none absolute bottom-full left-0 z-(--z-sticky) mb-2 w-max min-w-40 max-w-64 rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink shadow-float print:hidden">
      <p className="mb-1 truncate font-semibold">{title}</p>
      <ul className="grid gap-0.5">
        {shown.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <Swatch status={s} />
            <span className="text-muted">{statusLabel[s]}</span>
            <span className="ml-auto pl-3 font-mono font-semibold tabular-nums">
              {counts[s]} <span className="font-normal text-muted">({percent(counts[s], total)})</span>
            </span>
          </li>
        ))}
      </ul>
      {showTotal && (
        <p className="mt-1 flex border-t border-line pt-1 font-semibold">
          Total<span className="ml-auto font-mono tabular-nums">{total}</span>
        </p>
      )}
    </div>
  );
}
