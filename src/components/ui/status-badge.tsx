import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { SplitFlap } from "./split-flap";

export const APPOINTMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "CANCELLED", "COMPLETED"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Colour-coded appointment status (NFR06). The word is a split-flap, so when a status changes
 * on screen (e.g. PENDING to APPROVED after the lecturer acts) the letters flip to the new word.
 * Colour is never the only signal: the word is always shown.
 */
export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const style = { "--st": `var(--st-${status.toLowerCase()})` } as CSSProperties;
  return (
    <span
      className={cn(
        "status-badge inline-flex items-center rounded-chip px-2 py-0.5 text-[11px] font-bold leading-5 tracking-wide",
        "transition-[color,background-color,border-color] duration-200",
        className,
      )}
      style={style}
    >
      <SplitFlap value={status} speed="badge" />
    </span>
  );
}
