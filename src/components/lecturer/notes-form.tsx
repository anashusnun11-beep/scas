"use client";

import { LockSimpleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { noteSchema, type NoteInput } from "@/lib/validation/appointment-action";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { saveNoteAction } from "@/server/actions/lecturer-appointment";

/** FR12 Record Consultation Notes (UI8, SD9). First save completes the appointment; later saves edit the note. */
export function NotesForm({
  appointmentId,
  defaultNotes = "",
  defaultActionPlan = "",
  editing = false,
}: {
  appointmentId: number;
  defaultNotes?: string;
  defaultActionPlan?: string;
  editing?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<NoteInput>>({});
  const [message, setMessage] = useState<string>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = noteSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveNoteAction(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      toast({ tone: "success", title: result.message ?? "Notes saved." });
      // A newly completed appointment now belongs in History; an edit stays where it is.
      if (editing) router.refresh();
      else router.replace(`/lecturer/history/${appointmentId}`);
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
      {message && <FormMessage tone="error">{message}</FormMessage>}
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Field id={`notes-${appointmentId}`} label="Consultation notes" required error={errors.notes}>
        <Textarea name="notes" rows={6} maxLength={2000} defaultValue={defaultNotes} placeholder="What was discussed, decisions made, concerns raised." />
      </Field>
      <Field id={`plan-${appointmentId}`} label="Action plan / follow-up" error={errors.actionPlan}>
        <Textarea name="actionPlan" rows={3} maxLength={1000} defaultValue={defaultActionPlan} placeholder="e.g. 1) Update chapter 2 by Friday. 2) Book a follow-up in two weeks." />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <LockSimpleIcon aria-hidden className="size-4" />
          Only you and this student can see these notes.
        </p>
        <Button type="submit" loading={pending}>
          {editing ? "Save changes" : "Save notes and complete"}
        </Button>
      </div>
    </form>
  );
}
