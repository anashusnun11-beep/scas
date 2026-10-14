import { percent, REPORT_STATUSES, statusLabel, type ReportData, type ReportType } from "@/lib/reports";

const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted";
const num = "px-3 py-2.5 text-right font-mono text-sm tabular-nums";

function Swatch({ status }: { status: (typeof REPORT_STATUSES)[number] }) {
  return <span aria-hidden className="print-exact size-2.5 shrink-0 rounded-[2px]" style={{ background: `var(--chart-${status.toLowerCase()})` }} />;
}

/** FR16 summary table: every figure in the chart, readable without colour (the chart's accessible twin). */
export function ReportTable({ type, data }: { type: ReportType; data: ReportData }) {
  if (type === "BY_STATUS") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse print:min-w-0">
          <caption className="sr-only">Appointments by status</caption>
          <thead className="border-b border-line-strong">
            <tr>
              <th scope="col" className={th}>Status</th>
              <th scope="col" className={`${th} text-right`}>Appointments</th>
              <th scope="col" className={`${th} text-right`}>Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {REPORT_STATUSES.map((s) => (
              <tr key={s}>
                <th scope="row" className="px-3 py-2.5 text-left text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Swatch status={s} />
                    {statusLabel[s]}
                  </span>
                </th>
                <td className={num}>{data.counts[s]}</td>
                <td className={`${num} text-muted`}>{percent(data.counts[s], data.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-line-strong">
            <tr>
              <th scope="row" className="px-3 py-2.5 text-left text-sm font-semibold">Total</th>
              <td className={`${num} font-semibold`}>{data.total}</td>
              <td className={`${num} text-muted`}>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse print:min-w-0">
        <caption className="sr-only">Appointments by lecturer and status</caption>
        <thead className="border-b border-line-strong">
          <tr>
            <th scope="col" className={th}>Lecturer</th>
            {REPORT_STATUSES.map((s) => (
              <th key={s} scope="col" className={`${th} text-right`}>
                <span className="inline-flex items-center gap-1.5">
                  <Swatch status={s} />
                  {statusLabel[s]}
                </span>
              </th>
            ))}
            <th scope="col" className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.lecturers.map((l) => (
            <tr key={l.lecturerId}>
              <th scope="row" className="px-3 py-2.5 text-left text-sm font-medium">
                {l.name}
                <span className="block font-mono text-xs font-normal text-muted">
                  {l.lecturerId}
                  {l.inactive && " (inactive)"}
                </span>
              </th>
              {REPORT_STATUSES.map((s) => (
                <td key={s} className={`${num} ${l.counts[s] === 0 ? "text-muted" : ""}`}>
                  {l.counts[s]}
                </td>
              ))}
              <td className={`${num} font-semibold`}>{l.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-line-strong">
          <tr>
            <th scope="row" className="px-3 py-2.5 text-left text-sm font-semibold">All lecturers</th>
            {REPORT_STATUSES.map((s) => (
              <td key={s} className={`${num} font-semibold`}>{data.counts[s]}</td>
            ))}
            <td className={`${num} font-semibold`}>{data.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
