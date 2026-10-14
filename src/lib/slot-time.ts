/**
 * Slot time arithmetic (FR09). Times are minutes since midnight, Malaysian wall clock.
 * Pure functions, shared by the slot form (client) and saveSlot (server).
 */

const DAY_MINUTES = 24 * 60;

/** "09:30" -> 570. Returns null for anything that isn't a valid HH:MM. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** 570 -> "09:30" */
export function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Minutes since midnight of a Prisma TIME value (stored as 1970-01-01Txx:xx:00Z). */
export function minutesOf(time: Date) {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

/** A Prisma TIME value from minutes since midnight. */
export function timeFromMinutes(minutes: number) {
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60));
}

/**
 * End = start + session duration (decision log). Null if the slot would reach midnight: a TIME column
 * stores 24:00 as 00:00, which would break the end_time > start_time CHECK.
 */
export function endFor(startMinutes: number, durationMinutes: number): number | null {
  const end = startMinutes + durationMinutes;
  return end < DAY_MINUTES ? end : null;
}

/** Two slots on the same day overlap if each starts before the other ends. Touching (10:00-10:30 and 10:30-11:00) is fine. */
export function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}
