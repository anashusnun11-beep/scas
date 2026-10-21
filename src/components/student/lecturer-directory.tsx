import { CaretRightIcon, ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { formatSlotDate, formatTimeRange } from "@/lib/dates";
import type { LecturerDirectoryEntry } from "@/server/queries/student";

/**
 * FR03 for every lecturer: one row per active lecturer with their open slots. Students may consult
 * any active lecturer (decision 2026-10-21). `hrefFor` decides where a row goes (details or booking).
 */
export function LecturerDirectory({
  lecturers,
  hrefFor = (id) => `/student/lecturers/${encodeURIComponent(id)}`,
  limit,
}: {
  lecturers: LecturerDirectoryEntry[];
  hrefFor?: (lecturerId: string) => string;
  limit?: number;
}) {
  if (lecturers.length === 0) {
    return (
      <EmptyState icon={ChalkboardTeacherIcon} title="No lecturers yet">
        The admin office has not added any lecturers. Check again later.
      </EmptyState>
    );
  }

  const shown = limit ? lecturers.slice(0, limit) : lecturers;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {shown.map((l) => (
        <li key={l.lecturerId} className="min-w-0">
          <Link
            href={hrefFor(l.lecturerId)}
            className="group flex items-center gap-3 rounded-control border border-line bg-surface px-4 py-3 transition-[border-color,background-color,transform] duration-150 hover:border-primary hover:bg-surface-2 active:scale-[0.99] motion-reduce:active:scale-100"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{l.user.name}</span>
              <span className="block truncate text-sm text-muted">
                {[l.department, l.officeRoom].filter(Boolean).join(", ") || "Department not set"}
              </span>
              <span className={cn("mt-1 block truncate text-xs font-semibold", l.openSlots ? "text-success" : "text-muted")}>
                {l.openSlots
                  ? `${l.openSlots} open slot${l.openSlots === 1 ? "" : "s"}, next ${formatSlotDate(l.nextSlot!.slotDate)} ${formatTimeRange(l.nextSlot!.startTime, l.nextSlot!.endTime)}`
                  : "No open slots yet"}
              </span>
            </span>
            <CaretRightIcon aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
