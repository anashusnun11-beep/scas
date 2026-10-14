import { isReportType } from "@/lib/reports";
import { prisma } from "@/server/db";
import { PAGE_SIZE } from "@/server/queries/admin";
import { aggregateAppointments } from "@/server/services/reports";

// Read side of ReportController: reopen a saved report, list past reports.

// Same page size as the other admin lists, so the shared <Pager> counts pages correctly.
export const REPORT_PAGE_SIZE = PAGE_SIZE;

/**
 * One saved report with its figures. The reports table stores the type and period only
 * (SRS schema), so the figures are recalculated from the current appointments on every open.
 */
export async function getReport(reportId: number) {
  if (!Number.isInteger(reportId) || reportId <= 0) return null;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, reportType: true, dateFrom: true, dateTo: true, generatedAt: true, admin: { select: { adminId: true, user: { select: { name: true } } } } },
  });
  if (!report || !isReportType(report.reportType)) return null;
  const data = await aggregateAppointments(report.dateFrom, report.dateTo);
  return { ...report, reportType: report.reportType, data };
}

export type SavedReport = NonNullable<Awaited<ReturnType<typeof getReport>>>;

/** Previously generated reports, newest first. */
export async function getReportList(page: number) {
  const [total, rows] = await Promise.all([
    prisma.report.count(),
    prisma.report.findMany({
      orderBy: { generatedAt: "desc" },
      skip: (page - 1) * REPORT_PAGE_SIZE,
      take: REPORT_PAGE_SIZE,
      select: { id: true, reportType: true, dateFrom: true, dateTo: true, generatedAt: true, admin: { select: { user: { select: { name: true } } } } },
    }),
  ]);
  return { total, rows };
}
