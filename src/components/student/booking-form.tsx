"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { cn } from "@/lib/cn";
import { STUDENT_ID_EXAMPLE } from "@/lib/student-id";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { bookingSchema, type BookingInput } from "@/lib/validation/booking";
import { submitBookingAction } from "@/server/actions/appointment";
import type { SlotOption } from "./slot-options";

const PURPOSE_MAX = 500;

/** FR05 Book Appointment (UI3): Insert Student ID, choose a slot, enter the purpose, submit as PENDING. */
export function BookingForm({
  slots,
  initialSlotId,
  lecturerName,
}: {
  slots: SlotOption[];
  initialSlotId?: number;
  lecturerName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const bookable = slots.filter((s) => !s.booked && !s.closedReason);
  const [slotId, setSlotId] = useState<number | undefined>(bookable.some((s) => s.id === initialSlotId) ? initialSlotId : undefined);
  const [purposeLength, setPurposeLength] = useState(0);
  const [errors, setErrors] = useState<FieldErrors<BookingInput>>({});
  const [message, setMessage] = useState<string>();
  const selected = slots.find((s) => s.id === slotId);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = bookingSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      form.querySelector<HTMLElement>("[aria-invalid=true], fieldset[aria-invalid=true] input")?.focus();
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await submitBookingAction(data);
      if (result.ok) {
        toast({ tone: "success", title: "Booking submitted", description: "Your lecturer will approve or reject it. Status: PENDING." });
        router.push(result.redirectTo ?? "/student/appointments");
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
      // The slot list may be out of date (someone else booked first): reload it from the server.
      if (result.errors.slotId) {
        setSlotId(undefined);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Book a consultation" description={`With ${lecturerName}. Fields marked * are required.`} />
        <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-6 p-5">
          {message && <FormMessage tone="error">{message}</FormMessage>}

          <Field
            id="booking-student-id"
            label="Student ID"
            required
            error={errors.studentId}
            hint={`Type your own student ID, e.g. ${STUDENT_ID_EXAMPLE}. It is checked before the booking is saved.`}
          >
            <Input name="studentId" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={20} className="max-w-xs font-mono" />
          </Field>

          <fieldset
            aria-invalid={errors.slotId ? true : undefined}
            aria-describedby={errors.slotId ? "booking-slot-error" : undefined}
            className="grid gap-3"
          >
            <legend className="mb-1.5 text-sm font-semibold">
              Time slot<span className="ml-0.5 text-danger" aria-hidden>*</span>
            </legend>
            {errors.slotId && (
              <p id="booking-slot-error" className="text-sm font-medium text-danger">
                {errors.slotId}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const disabled = slot.booked || Boolean(slot.closedReason);
                return (
                  <label
                    key={slot.id}
                    className={cn(
                      "relative cursor-pointer rounded-control border px-3 py-2.5 transition-[border-color,background-color,transform] duration-150",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                      disabled
                        ? "cursor-not-allowed border-line bg-surface-2 text-muted"
                        : slotId === slot.id
                          ? "border-primary bg-primary/12"
                          : "border-line bg-surface hover:border-line-strong active:scale-[0.98] motion-reduce:active:scale-100",
                    )}
                  >
                    <input
                      type="radio"
                      name="slotId"
                      value={slot.id}
                      disabled={disabled}
                      checked={slotId === slot.id}
                      onChange={() => {
                        setSlotId(slot.id);
                        setErrors((e) => ({ ...e, slotId: undefined }));
                      }}
                      className="sr-only"
                    />
                    <span className="block text-xs font-semibold text-muted">{slot.dayLabel}</span>
                    <span className={cn("block font-mono text-sm font-semibold", slot.booked && "line-through")}>{slot.timeLabel}</span>
                    <span className="block truncate text-xs text-muted">{slot.booked ? "Booked" : (slot.closedReason ?? slot.location)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field
            id="booking-purpose"
            label="Purpose of consultation"
            required
            error={errors.purpose}
            hint={`${purposeLength} / ${PURPOSE_MAX} characters`}
          >
            <Textarea
              name="purpose"
              rows={4}
              maxLength={PURPOSE_MAX}
              placeholder="e.g. Discuss my final year project scope"
              onChange={(e) => setPurposeLength(e.target.value.length)}
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? "Submitting" : "Submit booking"}
            </Button>
          </div>
        </form>
      </Card>

      <aside className="grid gap-4 lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
        <Card>
          <CardHeader title="Booking summary" />
          <dl className="grid gap-3 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Lecturer</dt>
              <dd className="text-right font-medium">{lecturerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-medium">{selected?.dayLabel ?? "Choose a slot"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Time</dt>
              <dd className="text-right font-mono font-medium">{selected?.timeLabel ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Venue</dt>
              <dd className="text-right font-medium">{selected?.location ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status after submit</dt>
              <dd className="text-right font-mono text-xs font-bold text-(--st-pending)">PENDING</dd>
            </div>
          </dl>
        </Card>
        <div className="flex gap-3 rounded-card border border-line bg-surface p-4 text-sm text-muted">
          <InfoIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
          <p>Your lecturer approves or rejects each request. A booked slot can&apos;t be taken by anyone else while your request is open.</p>
        </div>
      </aside>
    </div>
  );
}
