"use client";

import { CalendarXIcon } from "@phosphor-icons/react";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { cn } from "@/lib/cn";
import { rescheduleSchema, type RescheduleInput } from "@/lib/validation/appointment-action";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { rescheduleAction } from "@/server/actions/lecturer-appointment";
import type { SlotChoice } from "./items";

/** FR11 Reschedule, «include» Select Date & Time (SD8): pick one of your open slots and say why. */
export function RescheduleDialog({
  open,
  onClose,
  appointmentId,
  current,
  options,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  appointmentId: number;
  current: string;
  options: SlotChoice[];
  onDone: (message?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [slotId, setSlotId] = useState<number>();
  const [errors, setErrors] = useState<FieldErrors<RescheduleInput>>({});
  const [message, setMessage] = useState<string>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = rescheduleSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await rescheduleAction(data);
      if (result.ok) {
        onDone(result.message);
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Reschedule appointment" description={`Now: ${current}. Choose one of your open slots.`} className="max-w-2xl">
      {options.length === 0 ? (
        <EmptyState icon={CalendarXIcon} title="No open slots to move to">
          Add a new slot under Manage Availability first, then reschedule.
        </EmptyState>
      ) : (
        <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
          {message && <FormMessage tone="error">{message}</FormMessage>}
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <fieldset aria-invalid={errors.newSlotId ? true : undefined} aria-describedby={errors.newSlotId ? `new-slot-error-${appointmentId}` : undefined}>
            <legend className="mb-2 text-sm font-semibold">
              New slot<span className="ml-0.5 text-danger" aria-hidden>*</span>
            </legend>
            {errors.newSlotId && (
              <p id={`new-slot-error-${appointmentId}`} className="mb-2 text-sm font-medium text-danger">
                {errors.newSlotId}
              </p>
            )}
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto p-0.5 sm:grid-cols-3">
              {options.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "cursor-pointer rounded-control border px-3 py-2.5 transition-[border-color,background-color] duration-150",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    slotId === o.id ? "border-primary bg-primary/12" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <input type="radio" name="newSlotId" value={o.id} checked={slotId === o.id} onChange={() => setSlotId(o.id)} className="sr-only" />
                  <span className="block text-xs font-semibold text-muted">{o.dayLabel}</span>
                  <span className="block font-mono text-sm font-semibold">{o.timeLabel}</span>
                  <span className="block truncate text-xs text-muted">{o.location}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field id={`reschedule-reason-${appointmentId}`} label="Reason" required error={errors.reason} hint="The student sees this as the reason for rescheduling.">
            <Textarea name="reason" rows={2} maxLength={500} placeholder="e.g. I have a faculty meeting at the original time." />
          </Field>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Keep it
            </Button>
            <Button type="submit" loading={pending}>
              Reschedule
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
