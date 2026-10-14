import { CaretRightIcon, FileTextIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/admin/list-parts";
import { ReportForm, type RangePreset } from "@/components/admin/report-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { formatTimestamp, malaysiaToday } from "@/lib/dates";
import { formatRange, isReportType, reportCode, reportTypeLabel, toDateInput } from "@/lib/reports";
import { getReportList } from "@/server/queries/reports";

export const metadata: Metadata = { title: "Generate report | SCAS" };

/** Quick periods for the form, in Malaysian calendar months. The first one is the default. */
function rangePresets(): RangePreset[] {
  const today = malaysiaToday();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const day = (year: number, month: number, d: number) => toDateInput(new Date(Date.UTC(year, month, d)));
  return [
    { label: "This month", from: day(y, m, 1), to: day(y, m + 1, 0) },
    { label: "Last month", from: day(y, m - 1, 1), to: day(y, m, 0) },
    { label: "Last month and this month", from: day(y, m - 1, 1), to: day(y, m + 1, 0) },
    { label: "This year", from: day(y, 0, 1), to: day(y, 11, 31) },
  ];
}

/** FR16 Generate Report (UI11, SD13): the form, then every report generated so far. */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = Math.max(1, Math.floor(Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1));
  const { total, rows } = await getReportList(page);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="New report" description="Choose what to summarise and the period. Each report you generate is saved below." />
        <CardBody>
          <ReportForm presets={rangePresets()} />
        </CardBody>
      </Card>

      <section className="grid gap-3" aria-labelledby="past-reports">
        <h2 id="past-reports" className="font-display text-heading font-semibold">
          Past reports
        </h2>
        {rows.length === 0 ? (
          <EmptyState icon={FileTextIcon} title="No reports yet">
            Generate your first report above. It is saved here so you can open or print it again later.
          </EmptyState>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/reports/${r.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2/60 md:grid-cols-[6rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <span className="col-start-1 row-start-1 font-mono text-sm font-semibold">{reportCode(r.id)}</span>
                    <span className="col-span-2 row-start-2 min-w-0 truncate font-medium md:col-span-1 md:col-start-2 md:row-start-1">
                      {isReportType(r.reportType) ? reportTypeLabel[r.reportType] : r.reportType}
                    </span>
                    <span className="col-span-2 row-start-3 truncate text-sm md:col-span-1 md:col-start-3 md:row-start-1">{formatRange(r.dateFrom, r.dateTo)}</span>
                    <span className="col-span-2 row-start-4 truncate text-sm text-muted md:col-span-1 md:col-start-4 md:row-start-1">
                      {formatTimestamp(r.generatedAt)}, {r.admin.user.name.split(" ")[0]}
                    </span>
                    <CaretRightIcon aria-hidden className="col-start-2 row-start-1 size-4 justify-self-end text-muted md:col-start-5" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pager query={{ q: "", status: "ACTIVE", page }} total={total} basePath="/admin/reports" />
          </Card>
        )}
      </section>
    </div>
  );
}
