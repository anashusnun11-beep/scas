"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { clearErrorOnEdit } from "@/lib/form-errors";
import type { ActionResult } from "@/lib/action-result";
import { reasonSchema, type ReasonInput } from "@/lib/validation/appointment-action";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";

/** Asks for the reason the student will see, for reject (FR10) and cancel (FR11). */
export function ReasonDialog({
  open,
  onClose,
  appointmentId,
  title,
  description,
  confirmLabel,
  placeholder,
  action,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  appointmentId: number;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder: string;
  action: (data: FormData) => Promise<ActionResult<ReasonInput>>;
  onDone: (message?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<ReasonInput>>({});
  const [message, setMessage] = useState<string>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = reasonSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await action(data);
      if (result.ok) {
        onDone(result.message);
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
        {message && <FormMessage tone="error">{message}</FormMessage>}
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <Field id={`reason-${appointmentId}`} label="Reason" required error={errors.reason} hint="The student sees this with the appointment.">
          <Textarea name="reason" rows={3} maxLength={500} placeholder={placeholder} autoFocus />
        </Field>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Keep it
          </Button>
          <Button type="submit" variant="danger" loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
