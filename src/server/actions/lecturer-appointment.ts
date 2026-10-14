"use server";

import type { ActionResult } from "@/lib/action-result";
import {
  noteSchema,
  reasonSchema,
  rescheduleSchema,
  type NoteInput,
  type ReasonInput,
  type RescheduleInput,
} from "@/lib/validation/appointment-action";
import { fieldErrors } from "@/lib/validation/auth";
import { requireLecturer } from "@/server/lecturer-context";
import {
  AppointmentActionError,
  approveAppointment,
  cancelAppointment,
  rejectAppointment,
  rescheduleAppointment,
  saveNote,
} from "@/server/services/appointment-status";

function fail<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppointmentActionError) {
    return error.field ? { ok: false, errors: { [error.field]: error.message } as never } : { ok: false, errors: {}, message: error.message };
  }
  throw error;
}

/** FR10 approve (SD7). */
export async function approveAction(appointmentId: number): Promise<ActionResult<ReasonInput>> {
  const { lecturerId } = await requireLecturer();
  try {
    await approveAppointment(lecturerId, Number(appointmentId));
    return { ok: true, message: "Appointment approved." };
  } catch (error) {
    return fail(error);
  }
}

/** FR10 reject with a reason (SD7 alt). */
export async function rejectAction(formData: FormData): Promise<ActionResult<ReasonInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = reasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await rejectAppointment(lecturerId, parsed.data.appointmentId, parsed.data.reason);
    return { ok: true, message: "Request rejected. The slot is open again." };
  } catch (error) {
    return fail(error);
  }
}

/** FR11 cancel with a reason (SD8 alt). */
export async function cancelAction(formData: FormData): Promise<ActionResult<ReasonInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = reasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await cancelAppointment(lecturerId, parsed.data.appointmentId, parsed.data.reason);
    return { ok: true, message: "Appointment cancelled. The slot is open again." };
  } catch (error) {
    return fail(error);
  }
}

/** FR11 reschedule to another open slot (SD8). */
export async function rescheduleAction(formData: FormData): Promise<ActionResult<RescheduleInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = rescheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await rescheduleAppointment(lecturerId, parsed.data.appointmentId, parsed.data.newSlotId, parsed.data.reason);
    return { ok: true, message: "Appointment rescheduled." };
  } catch (error) {
    return fail(error);
  }
}

/** FR12 record (or edit) consultation notes (SD9). */
export async function saveNoteAction(formData: FormData): Promise<ActionResult<NoteInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const result = await saveNote(lecturerId, parsed.data.appointmentId, parsed.data.notes, parsed.data.actionPlan);
    return { ok: true, message: result.completed ? "Notes saved. The appointment is now COMPLETED." : "Notes updated." };
  } catch (error) {
    return fail(error);
  }
}
