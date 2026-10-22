"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/guard";
import { fieldErrors } from "@/lib/validation/auth";
import { reportSchema, type ReportInput } from "@/lib/validation/report";
import { reportCode } from "@/lib/reports";
import { deleteReport, generateReport } from "@/server/services/reports";

export type ReportActionResult = ActionResult<ReportInput> | { ok: false; empty: true; errors: Record<string, never>; message: string };

/** FR16 Generate Report (SD13 step 2, generateReport(type, dateFrom, dateTo)). ADMIN only (NFR02). */
export async function generateReportAction(formData: FormData): Promise<ReportActionResult> {
  const user = await requireRole("ADMIN");
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const result = await generateReport(user.id, parsed.data);
  if (result.empty) return { ok: false, empty: true, errors: {}, message: "No record for the selected period." };
  return { ok: true, redirectTo: `/admin/reports/${result.reportId}`, message: "Report generated." };
}

/** Delete one saved report from Past reports (decision 2026-10-23). ADMIN only (NFR02). */
export async function deleteReportAction(reportId: number): Promise<{ ok: boolean; message: string }> {
  await requireRole("ADMIN");
  if (!Number.isInteger(reportId) || reportId < 1) return { ok: false, message: "This report was not found." };
  const deleted = await deleteReport(reportId);
  return deleted
    ? { ok: true, message: `Report ${reportCode(reportId)} deleted.` }
    : { ok: false, message: "This report was already deleted." };
}
