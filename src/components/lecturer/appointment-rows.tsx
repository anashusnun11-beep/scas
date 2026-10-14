import { CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { remarksLabel } from "@/lib/appointment";
import { lecturerAppointmentPath, type AppointmentItem } from "./items";

/** Lecturer appointment rows (Appointments, History, dashboard). Each opens the page for its status. */
export function AppointmentRows({ items, showNeedsNotes = false }: { items: AppointmentItem[]; showNeedsNotes?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={lecturerAppointmentPath(item.status, item.id)}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors duration-150 hover:bg-surface-2/60"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="truncate font-semibold">{item.studentName}</span>
                <span className="font-mono text-xs text-muted">{item.studentId}</span>
              </p>
              <p className="truncate font-mono text-sm">
                {item.code} {item.dayLabel}, {item.timeLabel}
              </p>
              <p className="truncate text-sm text-muted">{item.purpose}</p>
              {showNeedsNotes && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
                  <NotePencilIcon aria-hidden className="size-4" />
                  Consultation started: record the notes
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              <CaretRightIcon aria-hidden className="size-4 text-muted" />
            </div>
            {item.remarks && (
              <p className="col-span-2 mt-1 rounded-chip bg-surface-2 px-3 py-2 text-sm">
                <span className="font-semibold">{remarksLabel(item.status)}:</span> {item.remarks}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
