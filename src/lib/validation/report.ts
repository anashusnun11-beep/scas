import { z } from "zod";
import { daysInRange, MAX_RANGE_DAYS, parseDateInput, REPORT_TYPES } from "@/lib/reports";

/** FR16 report form, shared by client and server. The refinements are SD13 step 3, validateDateRange(). */
export const reportSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES, { error: "Choose a report type." }),
    dateFrom: z.string().refine((v) => parseDateInput(v) !== null, "Choose the start date."),
    dateTo: z.string().refine((v) => parseDateInput(v) !== null, "Choose the end date."),
  })
  .superRefine((value, ctx) => {
    const from = parseDateInput(value.dateFrom);
    const to = parseDateInput(value.dateTo);
    if (!from || !to) return;
    if (to < from) {
      ctx.addIssue({ code: "custom", path: ["dateTo"], message: "The end date must be on or after the start date." });
    } else if (daysInRange(from, to) > MAX_RANGE_DAYS) {
      ctx.addIssue({ code: "custom", path: ["dateTo"], message: `A report can cover up to ${MAX_RANGE_DAYS} days. Choose a shorter period.` });
    }
  });

export type ReportInput = z.infer<typeof reportSchema>;
