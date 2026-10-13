/**
 * Dates and times for slots. `slot_date` (DATE) and `start_time` / `end_time` (TIME) are Malaysian
 * wall-clock values. Prisma returns them as Dates in UTC (slot_date at 00:00Z, times on 1970-01-01),
 * so all formatting here reads the UTC fields and never converts time zones twice.
 * Malaysia has no daylight saving: always UTC+8.
 */

export const TIME_ZONE = "Asia/Kuala_Lumpur";
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in Malaysia, as a UTC-midnight Date (same shape as slot_date). */
export function malaysiaToday(now = new Date()): Date {
  const local = new Date(now.getTime() + MYT_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Monday 00:00 to next Monday 00:00 (exclusive) of the week containing `date`. Weeks run Monday to Sunday. */
export function weekRange(date: Date) {
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  const start = addDays(date, -sinceMonday);
  return { start, end: addDays(start, 7) };
}

/** The real moment a slot starts (for "is it in the past" and minimum notice). */
export function slotStartsAt(slotDate: Date, startTime: Date): Date {
  return new Date(
    Date.UTC(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), startTime.getUTCHours(), startTime.getUTCMinutes()) -
      MYT_OFFSET_MS,
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const longDateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "Mon, 19 Oct" */
export function formatSlotDate(slotDate: Date) {
  return dateFormat.format(slotDate);
}

/** "Monday, 19 October 2026" */
export function formatLongDate(slotDate: Date) {
  return longDateFormat.format(slotDate);
}

/** "10:00" from a TIME column. */
export function formatTime(time: Date) {
  return `${String(time.getUTCHours()).padStart(2, "0")}:${String(time.getUTCMinutes()).padStart(2, "0")}`;
}

/** "10:00 - 10:30" */
export function formatTimeRange(start: Date, end: Date) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/** A real timestamp (created_at etc.) shown in Malaysian time: "14 Oct 2026, 09:12". */
export function formatTimestamp(moment: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(moment);
}
