"use client";

import { ChartBarIcon, FileMagnifyingGlassIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { formatRange, parseDateInput, REPORT_TYPES, reportTypeLabel, type ReportType } from "@/lib/reports";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { reportSchema, type ReportInput } from "@/lib/validation/report";
import { generateReportAction } from "@/server/actions/report";

export type RangePreset = { label: string; from: string; to: string };

/**
 * FR16 Generate Report (UI11, SD13 steps 1-2): report type and date range.
 * Data found: the report opens on its own page. Nothing in the period: SD13 alt, nothing is saved.
 */
export function ReportForm({ presets, initialType = "BY_LECTURER" }: { presets: RangePreset[]; initialType?: ReportType }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<ReportInput>>({});
  const [message, setMessage] = useState<string>();
  const [empty, setEmpty] = useState<string>();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = reportSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    setEmpty(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await generateReportAction(data);
      if (result.ok) {
        toast({ tone: "success", title: result.message ?? "Report generated." });
        router.push(result.redirectTo ?? "/admin/reports");
        return;
      }
      if ("empty" in result) {
        setEmpty(formatRange(parseDateInput(parsed.data.dateFrom)!, parseDateInput(parsed.data.dateTo)!));
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
    });
  }

  return (
    <div className="grid gap-4">
      <form
        method="post"
        onSubmit={onSubmit}
        onChange={(e) => {
          clearErrorOnEdit(setErrors)(e);
          setEmpty(undefined);
        }}
        noValidate
        className="grid gap-4"
      >
        {message && <FormMessage tone="error">{message}</FormMessage>}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <Field id="report-type" label="Report type" required error={errors.reportType}>
            <Select name="reportType" defaultValue={initialType}>
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {reportTypeLabel[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="report-from" label="From" required error={errors.dateFrom}>
            <Input name="dateFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field id="report-to" label="To" required error={errors.dateTo}>
            <Input name="dateTo" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
          {/* Lines the button up with the inputs (the labels sit above them) on wide screens. */}
          <div className="grid lg:pt-[1.625rem]">
            <Button type="submit" loading={pending}>
              <ChartBarIcon aria-hidden className="size-4" weight="bold" />
              Generate report
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick periods">
          <span className="text-sm text-muted">Quick period:</span>
          {presets.map((p) => {
            const active = p.from === from && p.to === to;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFrom(p.from);
                  setTo(p.to);
                  setEmpty(undefined);
                  setErrors((e) => ({ ...e, dateFrom: undefined, dateTo: undefined }));
                }}
                className="h-9 rounded-chip border border-line px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface-2 aria-pressed:border-primary aria-pressed:bg-primary/15"
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted">Appointments are counted by their consultation date. Both dates are included.</p>
      </form>

      {empty && (
        <div role="status">
          <EmptyState icon={FileMagnifyingGlassIcon} title="No record for the selected period">
            There are no appointments from {empty}. Nothing was saved. Try a longer period or another month.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
