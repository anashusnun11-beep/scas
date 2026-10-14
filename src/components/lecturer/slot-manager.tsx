"use client";

import { CalendarPlusIcon, LockSimpleIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { AppointmentStatus } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { endFor, formatMinutes, parseTimeOfDay } from "@/lib/slot-time";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { slotSchema, type SlotInput } from "@/lib/validation/slot";
import { deleteSlotAction, saveSlotAction } from "@/server/actions/slot";
import { lecturerAppointmentPath } from "./items";

export type SlotItem = {
  id: number;
  dateValue: string;
  dayLabel: string;
  startValue: string;
  timeLabel: string;
  location: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
  started: boolean;
  hasHistory: boolean;
  booking: { id: number; status: AppointmentStatus; studentName: string } | null;
};

const SLOT_COLOUR: Record<SlotItem["status"], string> = {
  AVAILABLE: "var(--st-approved)",
  BOOKED: "var(--st-pending)",
  UNAVAILABLE: "var(--st-cancelled)",
};

function SlotStatus({ status }: { status: SlotItem["status"] }) {
  return (
    <span
      className="status-badge inline-flex rounded-chip px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide"
      style={{ "--st": SLOT_COLOUR[status] } as CSSProperties}
    >
      {status}
    </span>
  );
}

type FormState = { slotId?: number; slotDate: string; startTime: string; location: string; status: "AVAILABLE" | "UNAVAILABLE"; historyLocked: boolean };

/** FR09 Update Lecturer Slot Availability (UI7, SD6). */
export function SlotManager({
  slots,
  sessionDuration,
  today,
  defaultLocation,
}: {
  slots: SlotItem[];
  sessionDuration: number;
  today: string;
  defaultLocation: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const empty: FormState = { slotDate: "", startTime: "", location: defaultLocation, status: "AVAILABLE", historyLocked: false };
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<FieldErrors<SlotInput>>({});
  const [message, setMessage] = useState<string>();
  const [toDelete, setToDelete] = useState<SlotItem | null>(null);

  const start = parseTimeOfDay(form.startTime);
  const end = start === null ? null : endFor(start, sessionDuration);

  function edit(slot: SlotItem) {
    setForm({ slotId: slot.id, slotDate: slot.dateValue, startTime: slot.startValue, location: slot.location, status: slot.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE", historyLocked: slot.hasHistory });
    setErrors({});
    setMessage(undefined);
    document.getElementById("slot-date")?.focus();
  }

  function clear() {
    setForm(empty);
    setErrors({});
    setMessage(undefined);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = slotSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveSlotAction(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      toast({ tone: "success", title: result.message ?? "Saved." });
      clear();
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const slot = toDelete;
    startTransition(async () => {
      const result = await deleteSlotAction(slot.id);
      setToDelete(null);
      if (result.ok) {
        toast({ tone: "success", title: result.message ?? "Deleted." });
        if (form.slotId === slot.id) clear();
        router.refresh();
      } else toast({ tone: "error", title: "Could not delete", description: result.message });
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-[calc(var(--topbar-height)+1.5rem)]">
        <CardHeader title={form.slotId ? "Edit slot" : "Add a slot"} description={`Each slot is ${sessionDuration} minutes (your session length).`} />
        <form method="post" onSubmit={onSubmit} noValidate className="grid gap-4 p-5">
          {message && <FormMessage tone="error">{message}</FormMessage>}
          {form.historyLocked && (
            <FormMessage tone="info">This slot has past appointments, so only its status can change.</FormMessage>
          )}
          {form.slotId && <input type="hidden" name="slotId" value={form.slotId} />}
          <Field id="slot-date" label="Date" required error={errors.slotDate}>
            <Input
              name="slotDate"
              type="date"
              min={today}
              value={form.slotDate}
              readOnly={form.historyLocked}
              onChange={(e) => setForm({ ...form, slotDate: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="slot-start" label="Start" required error={errors.startTime}>
              <Input
                name="startTime"
                type="time"
                step={300}
                value={form.startTime}
                readOnly={form.historyLocked}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold">End</span>
              <output
                htmlFor="slot-start"
                aria-live="polite"
                className="flex h-(--control-height) items-center rounded-control border border-dashed border-line-strong px-3.5 font-mono text-muted"
              >
                {end === null ? (start === null ? "--:--" : "after midnight") : formatMinutes(end)}
              </output>
            </div>
          </div>
          <Field id="slot-location" label="Location" required error={errors.location} hint="Office room or online meeting link.">
            <Input name="location" maxLength={100} value={form.location} readOnly={form.historyLocked} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field id="slot-status" label="Status" required error={errors.status}>
            <Select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}>
              <option value="AVAILABLE">Available to book</option>
              <option value="UNAVAILABLE">Unavailable (hidden from students)</option>
            </Select>
          </Field>
          <div className="flex gap-3">
            <Button type="submit" loading={pending} className="flex-1">
              {form.slotId ? "Save changes" : "Add slot"}
            </Button>
            <Button variant="secondary" onClick={clear} disabled={pending}>
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted">Slots can&apos;t overlap each other or be in the past.</p>
        </form>
      </Card>

      <Card>
        <CardHeader title="Your slots" description="From today onwards. Booked slots are locked until the appointment is rescheduled or cancelled." />
        {slots.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={CalendarPlusIcon} title="No slots yet">
              Add your first consultation slot with the form. Students can book it straight away.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {slots.map((slot) => {
              const locked = slot.status === "BOOKED";
              return (
                <li key={slot.id} className={cn("grid gap-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", form.slotId === slot.id && "bg-primary/8")}>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">{slot.dayLabel}</span>
                      <span className="font-mono text-sm">{slot.timeLabel}</span>
                      <SlotStatus status={slot.status} />
                    </p>
                    <p className="truncate text-sm text-muted">
                      {slot.location}
                      {slot.booking && (
                        <>
                          {" "}
                          <Link href={lecturerAppointmentPath(slot.booking.status, slot.booking.id)} className="text-accent-ink hover:underline">
                            Booked by {slot.booking.studentName} ({slot.booking.status.toLowerCase()})
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {locked || slot.started ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted" title={locked ? "Booked: reschedule or cancel the appointment first." : "Already started."}>
                        <LockSimpleIcon aria-hidden className="size-4" />
                        {locked ? "Locked" : "Started"}
                      </span>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => edit(slot)} aria-label={`Edit ${slot.dayLabel} ${slot.timeLabel}`}>
                          <PencilSimpleIcon aria-hidden className="size-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setToDelete(slot)}
                          disabled={slot.hasHistory}
                          title={slot.hasHistory ? "Has past appointments: make it unavailable instead." : undefined}
                          aria-label={`Delete ${slot.dayLabel} ${slot.timeLabel}`}
                          className="text-danger"
                        >
                          <TrashIcon aria-hidden className="size-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {toDelete && (
        <Dialog open onClose={() => setToDelete(null)} title="Delete this slot?" description={`${toDelete.dayLabel}, ${toDelete.timeLabel}, ${toDelete.location}`}>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={pending}>
              Delete slot
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
