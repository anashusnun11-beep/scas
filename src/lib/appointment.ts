import type { AppointmentStatus } from "@/components/ui/status-badge";

/** Statuses that count towards consultation limits (BR2 + decision: COMPLETED counts too). */
export const LIMIT_STATUSES = ["PENDING", "APPROVED", "RESCHEDULED", "COMPLETED"] as const satisfies readonly AppointmentStatus[];

/** Statuses that hold a slot (the partial unique index uses the same list). */
export const ACTIVE_STATUSES = ["PENDING", "APPROVED", "RESCHEDULED"] as const satisfies readonly AppointmentStatus[];

/** "APT-0012", shown everywhere instead of the raw id. Not stored. */
export function appointmentCode(id: number) {
  return `APT-${String(id).padStart(4, "0")}`;
}

/** FR07 / BR5: the slip is for confirmed appointments only (RESCHEDULED counts as confirmed, decision log). */
export function canPrintSlip(status: AppointmentStatus) {
  return status === "APPROVED" || status === "RESCHEDULED";
}

/** Label for the lecturer's remarks, depending on why they were written. */
export function remarksLabel(status: AppointmentStatus) {
  switch (status) {
    case "REJECTED":
      return "Reason for rejection";
    case "CANCELLED":
      return "Reason for cancellation";
    case "RESCHEDULED":
      return "Reason for rescheduling";
    default:
      return "Lecturer's remarks";
  }
}
