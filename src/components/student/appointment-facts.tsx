import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatLongDate, formatTimeRange } from "@/lib/dates";
import type { AppointmentDetail } from "@/server/queries/student";

/** The facts of one appointment, shared by the detail page and the printable slip (UI5). */
export function AppointmentFacts({ appointment: a, showStudent = false }: { appointment: AppointmentDetail; showStudent?: boolean }) {
  const rows: [string, ReactNode][] = [
    ...(showStudent
      ? ([
          ["Student name", a.student.user.name],
          ["Student ID", <span key="id" className="font-mono">{a.student.studentId}</span>],
          ["Programme", a.student.programme ?? "Not set"],
        ] as [string, ReactNode][])
      : []),
    ["Lecturer", a.lecturer.user.name],
    ["Date", formatLongDate(a.slot.slotDate)],
    ["Time", <span key="time" className="font-mono">{formatTimeRange(a.slot.startTime, a.slot.endTime)}</span>],
    ["Venue", a.slot.location],
    ["Purpose", a.purpose],
    ["Status", <StatusBadge key="status" status={a.status} />],
  ];

  return (
    <dl className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
