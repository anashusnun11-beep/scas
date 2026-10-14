import { emptyCounts, parseDateInput, type ReportData, type ReportType, type LecturerSummary } from "@/lib/reports";
import type { ReportInput } from "@/lib/validation/report";
import { prisma } from "@/server/db";

// ReportController (SD13): aggregateAppointments() and insertReport().

/**
 * SD13 step 4, aggregateAppointments(dateFrom, dateTo): appointments whose consultation date (slot_date)
 * falls in the range, both ends included, counted per lecturer and status.
 * Lecturers: every active one (zeros included), plus inactive ones that have data in the period.
 */
export async function aggregateAppointments(dateFrom: Date, dateTo: Date): Promise<ReportData> {
  const [groups, lecturers] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["lecturerId", "status"],
      where: { slot: { slotDate: { gte: dateFrom, lte: dateTo } } },
      _count: { _all: true },
    }),
    prisma.lecturer.findMany({ select: { lecturerId: true, user: { select: { name: true, accountStatus: true } } } }),
  ]);

  const counts = emptyCounts();
  const byLecturer = new Map<string, LecturerSummary>(
    lecturers.map((l) => [l.lecturerId, { lecturerId: l.lecturerId, name: l.user.name, inactive: l.user.accountStatus === "INACTIVE", counts: emptyCounts(), total: 0 }]),
  );
  for (const g of groups) {
    const n = g._count._all;
    counts[g.status] += n;
    const row = byLecturer.get(g.lecturerId);
    if (row) {
      row.counts[g.status] += n;
      row.total += n;
    }
  }

  const rows = [...byLecturer.values()]
    .filter((l) => !l.inactive || l.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return { total, counts, lecturers: rows };
}

export type GenerateResult = { empty: true } | { empty: false; reportId: number };

/**
 * FR16 Generate Report (SD13). Input is already validated by reportSchema (step 3).
 * Data found: insertReport (steps 6-7) and return the new report_id.
 * No data in the period (alt 5a-7a): nothing is saved, the page says so.
 */
export async function generateReport(userId: number, input: ReportInput): Promise<GenerateResult> {
  const dateFrom = parseDateInput(input.dateFrom)!;
  const dateTo = parseDateInput(input.dateTo)!;
  const admin = await prisma.admin.findUniqueOrThrow({ where: { userId }, select: { adminId: true } });

  const data = await aggregateAppointments(dateFrom, dateTo);
  if (data.total === 0) return { empty: true };

  const report = await prisma.report.create({
    data: { adminId: admin.adminId, reportType: input.reportType satisfies ReportType, dateFrom, dateTo },
    select: { id: true },
  });
  return { empty: false, reportId: report.id };
}
