import { CalendarXIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { SlotOption } from "./slot-options";

/**
 * FR04 View Available Lecturer Slot. Open slots link straight to the booking form;
 * booked ones are crossed out and slots inside the notice period say why they are closed.
 */
export function SlotBoard({ slots, limit }: { slots: SlotOption[]; limit?: number }) {
  const shown = limit ? slots.slice(0, limit) : slots;
  if (shown.length === 0) {
    return (
      <EmptyState icon={CalendarXIcon} title="No open slots right now">
        Your lecturer has not opened any consultation slots for the next four weeks. Check again later or contact them by e-mail.
      </EmptyState>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
      {shown.map((slot) => {
        const open = !slot.booked && !slot.closedReason;
        const body = (
          <>
            <span className="block text-xs font-semibold text-muted">{slot.dayLabel}</span>
            <span className={cn("block font-mono text-sm font-semibold", slot.booked && "line-through")}>{slot.timeLabel}</span>
            <span className="block truncate text-xs text-muted">{slot.booked ? "Booked" : (slot.closedReason ?? slot.location)}</span>
          </>
        );
        return (
          <li key={slot.id}>
            {open ? (
              <Link
                href={`/student/book?slot=${slot.id}`}
                className="block rounded-control border border-line bg-surface px-3 py-2.5 transition-[border-color,background-color,transform] duration-150 hover:border-primary hover:bg-surface-2 active:scale-[0.98] motion-reduce:active:scale-100"
                aria-label={`Book ${slot.dayLabel}, ${slot.timeLabel}, ${slot.location}`}
              >
                {body}
              </Link>
            ) : (
              <div
                className="rounded-control border border-line bg-surface-2 px-3 py-2.5 text-muted"
                aria-label={`${slot.dayLabel}, ${slot.timeLabel}, ${slot.booked ? "already booked" : slot.closedReason}`}
              >
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
