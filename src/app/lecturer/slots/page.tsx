import type { Metadata } from "next";
import { SlotManager, type SlotItem } from "@/components/lecturer/slot-manager";
import { formatSlotDate, formatTime, formatTimeRange, malaysiaToday } from "@/lib/dates";
import { requireLecturer } from "@/server/lecturer-context";
import { getMySlots } from "@/server/queries/lecturer";
import { getLimitSettings } from "@/server/services/limits";

export const metadata: Metadata = { title: "Manage availability | SCAS" };

/** FR09 Update Lecturer Slot Availability (UI7, SD6). */
export default async function SlotsPage() {
  const { lecturer, lecturerId } = await requireLecturer();
  const [slots, settings] = await Promise.all([getMySlots(lecturerId), getLimitSettings(lecturerId)]);

  const items: SlotItem[] = slots.map((s) => ({
    id: s.id,
    dateValue: s.slotDate.toISOString().slice(0, 10),
    dayLabel: formatSlotDate(s.slotDate),
    startValue: formatTime(s.startTime),
    timeLabel: formatTimeRange(s.startTime, s.endTime),
    location: s.location,
    status: s.status,
    started: s.started,
    hasHistory: s.hasHistory,
    booking: s.booking,
  }));

  return (
    <SlotManager
      slots={items}
      sessionDuration={settings.sessionDuration}
      today={malaysiaToday().toISOString().slice(0, 10)}
      defaultLocation={slots.at(-1)?.location ?? lecturer.officeRoom ?? ""}
    />
  );
}
