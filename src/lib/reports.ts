import type { AppointmentStatus } from "@/generated/prisma/enums";

/**
 * FR16 Generate Report: shared by the form, the server and the report view.
 * Plain data only, so client components can import it.
 */

export const REPORT_TYPES = ["BY_LECTURER", "BY_STATUS"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const reportTypeLabel: Record<ReportType, string> = {
  BY_LECTURER: "Appointment summary by lecturer",
  BY_STATUS: "Appointment summary by status",
};

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

/** The longest period one report can cover (inclusive). */
export const MAX_RANGE_DAYS = 366;

/**
 * Status order in every report chart, legend and table. The chart palette (--chart-*) is validated
 * for colour-blind separation in exactly this order, so don't reorder it without re-running the check.
 */
export const REPORT_STATUSES = ["PENDING", "RESCHEDULED", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"] as const satisfies readonly AppointmentStatus[];

export const statusLabel: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export type StatusCounts = Record<AppointmentStatus, number>;

export function emptyCounts(): StatusCounts {
  return { PENDING: 0, APPROVED: 0, RESCHEDULED: 0, COMPLETED: 0, REJECTED: 0, CANCELLED: 0 };
}

export type LecturerSummary = {
  lecturerId: string;
  name: string;
  inactive: boolean;
  counts: StatusCounts;
  total: number;
};

/** What the report view needs: overall counts per status plus one row per lecturer. */
export type ReportData = {
  total: number;
  counts: StatusCounts;
  lecturers: LecturerSummary[];
};

/** The four summary counters. They add up to the total. */
export function summaryOf(counts: StatusCounts) {
  return {
    confirmed: counts.APPROVED + counts.RESCHEDULED + counts.COMPLETED,
    pending: counts.PENDING,
    closed: counts.REJECTED + counts.CANCELLED,
  };
}

/** "YYYY-MM-DD" (a date input value) to a UTC-midnight Date, the shape of slot_date. Null if not a real date. */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

/** A UTC-midnight Date back to "YYYY-MM-DD". */
export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Number of calendar days from `from` to `to`, counting both ends. */
export function daysInRange(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

const rangeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "1 Sep 2026 to 30 Sep 2026" */
export function formatRange(from: Date, to: Date) {
  return `${rangeFormat.format(from)} to ${rangeFormat.format(to)}`;
}

/** Share of the total as a whole-number percentage string ("33%"), "0%" when there is nothing. */
export function percent(part: number, total: number) {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

/** "RPT-0007", formatted from report_id at display time (like APT- codes). */
export function reportCode(reportId: number) {
  return `RPT-${String(reportId).padStart(4, "0")}`;
}
