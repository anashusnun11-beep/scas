import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentCode, remarksLabel } from "@/lib/appointment";
import { formatSlotDate, formatTimeRange } from "@/lib/dates";
import type { AppointmentRow } from "@/server/queries/student";

/** FR06 / FR08: one row per appointment, colour-coded status and remarks; opens the detail page. */
export function AppointmentList({ appointments }: { appointments: AppointmentRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {appointments.map((a) => (
        <li key={a.id}>
          <Link
            href={`/student/appointments/${a.id}`}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors duration-150 hover:bg-surface-2/60"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{a.purpose}</p>
              <p className="truncate font-mono text-xs text-muted">
                {appointmentCode(a.id)} {formatSlotDate(a.slot.slotDate)}, {formatTimeRange(a.slot.startTime, a.slot.endTime)}
              </p>
              <p className="truncate text-sm text-muted">
                {a.lecturer.user.name}, {a.slot.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={a.status} />
              <CaretRightIcon aria-hidden className="size-4 text-muted" />
            </div>
            {a.remarks && (
              <p className="col-span-2 mt-1 rounded-chip bg-surface-2 px-3 py-2 text-sm">
                <span className="font-semibold">{remarksLabel(a.status)}:</span> {a.remarks}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
