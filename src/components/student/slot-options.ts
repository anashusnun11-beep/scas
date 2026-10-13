import { formatSlotDate, formatTimeRange } from "@/lib/dates";
import type { SlotView } from "@/server/queries/student";

/** A slot ready for the UI: plain strings only, so it can cross into client components. */
export type SlotOption = {
  id: number;
  dayLabel: string;
  timeLabel: string;
  location: string;
  booked: boolean;
  closedReason?: string;
};

export function toSlotOptions(slots: SlotView[]): SlotOption[] {
  return slots.map((s) => ({
    id: s.id,
    dayLabel: formatSlotDate(s.slotDate),
    timeLabel: formatTimeRange(s.startTime, s.endTime),
    location: s.location,
    booked: s.status === "BOOKED",
    closedReason: s.closedReason,
  }));
}
