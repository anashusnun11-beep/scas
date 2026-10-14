import type { AppointmentStatus } from "@/components/ui/status-badge";
import { appointmentCode } from "@/lib/appointment";
import { formatSlotDate, formatTimeRange, formatTimestamp, slotStartsAt } from "@/lib/dates";
import type { LecturerRow } from "@/server/queries/lecturer";

/**
 * Where an appointment lives for the lecturer, by status, so the sidebar highlights the right page:
 * PENDING -> Booking Requests, APPROVED / RESCHEDULED -> Appointments, finished -> History.
 */
export function lecturerAppointmentPath(status: AppointmentStatus, id: number) {
  if (status === "PENDING") return `/lecturer/requests/${id}`;
  if (status === "APPROVED" || status === "RESCHEDULED") return `/lecturer/appointments/${id}`;
  return `/lecturer/history/${id}`;
}

/** An appointment row as plain strings, so it can be handed to client components. */
export type AppointmentItem = {
  id: number;
  code: string;
  status: AppointmentStatus;
  studentName: string;
  studentId: string;
  programme: string | null;
  dayLabel: string;
  timeLabel: string;
  location: string;
  purpose: string;
  remarks: string | null;
  requestedAt: string;
  started: boolean;
};

export function toAppointmentItem(row: LecturerRow, now = new Date()): AppointmentItem {
  return {
    id: row.id,
    code: appointmentCode(row.id),
    status: row.status,
    studentName: row.student.user.name,
    studentId: row.student.studentId,
    programme: row.student.programme,
    dayLabel: formatSlotDate(row.slot.slotDate),
    timeLabel: formatTimeRange(row.slot.startTime, row.slot.endTime),
    location: row.slot.location,
    purpose: row.purpose,
    remarks: row.remarks,
    requestedAt: formatTimestamp(row.createdAt),
    started: slotStartsAt(row.slot.slotDate, row.slot.startTime) <= now,
  };
}

/** A slot a request can be moved to (FR11). */
export type SlotChoice = { id: number; dayLabel: string; timeLabel: string; location: string };

export function toSlotChoices(slots: { id: number; slotDate: Date; startTime: Date; endTime: Date; location: string }[]): SlotChoice[] {
  return slots.map((s) => ({
    id: s.id,
    dayLabel: formatSlotDate(s.slotDate),
    timeLabel: formatTimeRange(s.startTime, s.endTime),
    location: s.location,
  }));
}
