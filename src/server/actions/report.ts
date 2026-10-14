"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/guard";
import { fieldErrors } from "@/lib/validation/auth";
import { reportSchema, type ReportInput } from "@/lib/validation/report";
import { generateReport } from "@/server/services/reports";

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
