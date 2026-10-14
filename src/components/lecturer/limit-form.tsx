"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { SESSION_DURATIONS, type LimitSettings } from "@/lib/limits";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { limitSchema, type LimitInput } from "@/lib/validation/limit";
import { resetLimitAction, saveLimitAction } from "@/server/actions/limit";

/** FR13 Set Consultation Limitation (UI9, SD10). Checked automatically on every booking. */
export function LimitForm({ settings }: { settings: LimitSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<LimitInput>>({});
  const [message, setMessage] = useState<string>();
  // Remount the inputs after a reset so they show the new defaults.
  const [version, setVersion] = useState(0);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = limitSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setMessage("Some values are not valid. Check the highlighted fields.");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveLimitAction(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      toast({ tone: "success", title: result.message ?? "Saved." });
      router.refresh();
    });
  }

  function reset() {
    startTransition(async () => {
      const result = await resetLimitAction();
      setErrors({});
      setMessage(undefined);
      toast({ tone: "success", title: result.message ?? "Reset." });
      setVersion((v) => v + 1);
      router.refresh();
    });
  }

  return (
    <form key={`${version}-${JSON.stringify(settings)}`} method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
      {message && <FormMessage tone="error">{message}</FormMessage>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="limit-day" label="Max consultations per day" required error={errors.maxPerDay} hint="Across all students.">
          <Input name="maxPerDay" type="number" inputMode="numeric" min={1} max={20} defaultValue={settings.maxPerDay} />
        </Field>
        <Field id="limit-week" label="Max consultations per week" required error={errors.maxPerWeek} hint="Monday to Sunday.">
          <Input name="maxPerWeek" type="number" inputMode="numeric" min={1} max={100} defaultValue={settings.maxPerWeek} />
        </Field>
        <Field id="limit-student" label="Max bookings per student per week" required error={errors.maxPerStudentWeek} hint="Stops one student taking every slot.">
          <Input name="maxPerStudentWeek" type="number" inputMode="numeric" min={1} max={20} defaultValue={settings.maxPerStudentWeek} />
        </Field>
        <Field id="limit-duration" label="Session length" required error={errors.sessionDuration} hint="New slots get this length.">
          <Select name="sessionDuration" defaultValue={String(settings.sessionDuration)}>
            {SESSION_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </Select>
        </Field>
        <Field id="limit-notice" label="Minimum notice before booking (hours)" required error={errors.minNoticeHours} hint="0 means students can book until the slot starts.">
          <Input name="minNoticeHours" type="number" inputMode="numeric" min={0} max={168} defaultValue={settings.minNoticeHours} />
        </Field>
        <div className="grid content-start gap-1.5">
          <span className="text-sm font-semibold">Limitation status</span>
          <label className="flex h-(--control-height) cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
            <input type="checkbox" name="isEnabled" defaultChecked={settings.isEnabled} className="peer sr-only" />
            <span
              aria-hidden
              className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors duration-150 peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:duration-150 peer-checked:after:translate-x-4"
            />
            <span className="text-sm">Check these limits on every booking</span>
          </label>
          <p className="text-sm text-muted">Switch off to accept bookings without limits.</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={reset} disabled={pending}>
          Reset to default
        </Button>
        <Button type="submit" loading={pending}>
          Save limitation
        </Button>
      </div>
    </form>
  );
}
