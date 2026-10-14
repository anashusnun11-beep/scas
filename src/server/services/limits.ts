import { LIMIT_STATUSES } from "@/lib/appointment";
import { malaysiaToday, weekRange } from "@/lib/dates";
import { DEFAULT_LIMIT, type LimitSettings } from "@/lib/limits";
import { prisma } from "@/server/db";

/** LimitController.getLimitSettings (SD10 steps 2-6): saved settings, or the defaults if none yet (SD10 alt). */
export async function getLimitSettings(lecturerId: string): Promise<LimitSettings & { saved: boolean; updatedAt: Date | null }> {
  const limit = await prisma.consultationLimit.findUnique({ where: { lecturerId } });
  if (!limit) return { ...DEFAULT_LIMIT, saved: false, updatedAt: null };
  return {
    maxPerDay: limit.maxPerDay,
    maxPerWeek: limit.maxPerWeek,
    maxPerStudentWeek: limit.maxPerStudentWeek,
    sessionDuration: limit.sessionDuration,
    minNoticeHours: limit.minNoticeHours,
    isEnabled: limit.isEnabled,
    saved: true,
    updatedAt: limit.updatedAt,
  };
}

/** LimitController.saveLimit (SD10 steps 8-11): validated input, upsert. */
export async function saveLimit(lecturerId: string, settings: LimitSettings) {
  await prisma.consultationLimit.upsert({
    where: { lecturerId },
    create: { lecturerId, ...settings },
    update: settings,
  });
}

/** "This week's usage" next to the form (UI9): counted the same way the booking check counts (BR2). */
export async function getWeekUsage(lecturerId: string, now = new Date()) {
  const today = malaysiaToday(now);
  const week = weekRange(today);
  const counted = { lecturerId, status: { in: [...LIMIT_STATUSES] } };

  const [todayCount, weekRows] = await Promise.all([
    prisma.appointment.count({ where: { ...counted, slot: { slotDate: today } } }),
    prisma.appointment.findMany({
      where: { ...counted, slot: { slotDate: { gte: week.start, lt: week.end } } },
      select: { student: { select: { studentId: true, user: { select: { name: true } } } } },
    }),
  ]);

  const perStudent = new Map<string, { studentId: string; name: string; count: number }>();
  for (const row of weekRows) {
    const entry = perStudent.get(row.student.studentId) ?? { studentId: row.student.studentId, name: row.student.user.name, count: 0 };
    entry.count += 1;
    perStudent.set(row.student.studentId, entry);
  }

  return {
    today: todayCount,
    week: weekRows.length,
    weekStart: week.start,
    students: [...perStudent.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}
