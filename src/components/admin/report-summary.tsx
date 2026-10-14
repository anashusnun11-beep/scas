import { AnimatedNumber } from "@/components/ui/animated-number";
import { summaryOf, type ReportData } from "@/lib/reports";

/** FR16 summary counters. The three parts add up to the total. */
export function ReportSummary({ data }: { data: ReportData }) {
  const s = summaryOf(data.counts);
  const counters = [
    { label: "Total appointments", value: data.total, hint: "In the period" },
    { label: "Confirmed", value: s.confirmed, hint: "Approved, rescheduled or completed" },
    { label: "Pending", value: s.pending, hint: "Waiting for the lecturer" },
    { label: "Rejected or cancelled", value: s.closed, hint: "Did not go ahead" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4">
      {counters.map((c, i) => (
        <div key={c.label} className={i === 0 ? "rounded-card border border-line-strong bg-surface-2 p-4" : "rounded-card border border-line bg-surface p-4"}>
          <dt className="text-sm text-muted">{c.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold">
            <AnimatedNumber value={c.value} />
          </dd>
          <dd className="mt-0.5 text-xs text-muted">{c.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
