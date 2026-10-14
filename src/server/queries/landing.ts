import { cacheLife } from "next/cache";
import { addDays, malaysiaToday, weekRange } from "@/lib/dates";
import { prisma } from "@/server/db";

/**
 * Live numbers for the public landing page. Cached for a few minutes (the page must stay under 3 s,
 * NFR04, and these numbers don't need to be to-the-second). Only counts, never personal data.
 *
 * - consultationsThisMonth: appointments whose consultation date is in this calendar month
 *   (Malaysian time), not counting rejected or cancelled ones.
 * - openSlotsThisWeek: AVAILABLE slots from today to Sunday.
 */
export async function getLandingStats() {
  "use cache";
  cacheLife("minutes");

  const today = malaysiaToday();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const sunday = addDays(weekRange(today).end, -1);

  const [consultationsThisMonth, activeLecturers, openSlotsThisWeek, students] = await Promise.all([
    prisma.appointment.count({
      where: { status: { notIn: ["REJECTED", "CANCELLED"] }, slot: { slotDate: { gte: monthStart, lte: monthEnd } } },
    }),
    prisma.lecturer.count({ where: { user: { accountStatus: "ACTIVE" } } }),
    prisma.availabilitySlot.count({ where: { slotStatus: "AVAILABLE", slotDate: { gte: today, lte: sunday } } }),
    prisma.student.count({ where: { user: { accountStatus: "ACTIVE" } } }),
  ]);

  return { consultationsThisMonth, activeLecturers, openSlotsThisWeek, students };
}
