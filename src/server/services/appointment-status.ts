import type { AppointmentStatus } from "@/generated/prisma/client";
import { ACTIVE_STATUSES } from "@/lib/appointment";
import { slotStartsAt } from "@/lib/dates";
import { prisma } from "@/server/db";
import { LOCKED_TX, lockLecturer } from "./locks";

// AppointmentController.updateStatus / reschedule / cancelAppointment and NoteController.saveNote
// (FR10, FR11, FR12; SD7, SD8, SD9). Every change runs under the lecturer lock and only applies
// if the appointment is still in the status the lecturer saw (two tabs can't both win).

export type AppointmentActionCode = "not-found" | "status-changed" | "slot-passed" | "slot-taken" | "slot-invalid" | "not-started";

export class AppointmentActionError extends Error {
  constructor(
    readonly code: AppointmentActionCode,
    message: string,
    readonly field?: "newSlotId" | "reason" | "notes",
  ) {
    super(message);
  }
}

const STATUS_WORD: Record<AppointmentStatus, string> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  RESCHEDULED: "rescheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Load an appointment of this lecturer, or fail as "not found" (NFR03: other lecturers' records don't exist). */
async function loadOwn(tx: Tx, lecturerId: string, appointmentId: number) {
  const appointment = await tx.appointment.findFirst({
    where: { id: appointmentId, lecturerId },
    include: { slot: true, note: true },
  });
  if (!appointment) throw new AppointmentActionError("not-found", "This appointment was not found.");
  return appointment;
}

function requireStatus(current: AppointmentStatus, allowed: readonly AppointmentStatus[]) {
  if (!allowed.includes(current)) {
    throw new AppointmentActionError("status-changed", `This appointment is already ${STATUS_WORD[current]}. Refresh to see its latest state.`);
  }
}

/** Set the status only if it is still `from` (belt and braces on top of the lock). */
async function transition(tx: Tx, id: number, from: readonly AppointmentStatus[], data: { status: AppointmentStatus; remarks?: string | null; slotId?: number }) {
  const updated = await tx.appointment.updateMany({ where: { id, status: { in: [...from] } }, data });
  if (updated.count !== 1) throw new AppointmentActionError("status-changed", "This appointment changed in the meantime. Refresh and try again.");
}

async function releaseSlot(tx: Tx, slotId: number) {
  await tx.availabilitySlot.updateMany({ where: { id: slotId, slotStatus: "BOOKED" }, data: { slotStatus: "AVAILABLE" } });
}

/** FR10 approve (SD7 steps 7-12). A request whose slot has already started can only be rejected (decision 2026-10-14). */
export async function approveAppointment(lecturerId: string, appointmentId: number, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const a = await loadOwn(tx, lecturerId, appointmentId);
    requireStatus(a.status, ["PENDING"]);
    if (slotStartsAt(a.slot.slotDate, a.slot.startTime) <= now) {
      throw new AppointmentActionError("slot-passed", "This slot has already passed, so it can't be approved. Reject the request instead.");
    }
    await transition(tx, a.id, ["PENDING"], { status: "APPROVED" });
  }, LOCKED_TX);
}

/** FR10 reject with a reason; the slot goes back to AVAILABLE (SD7 alt, BR3). */
export async function rejectAppointment(lecturerId: string, appointmentId: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const a = await loadOwn(tx, lecturerId, appointmentId);
    requireStatus(a.status, ["PENDING"]);
    await transition(tx, a.id, ["PENDING"], { status: "REJECTED", remarks: reason });
    await releaseSlot(tx, a.slotId);
  }, LOCKED_TX);
}

/** FR11 cancel with a reason; the slot goes back to AVAILABLE (SD8 alt, BR3). */
export async function cancelAppointment(lecturerId: string, appointmentId: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const a = await loadOwn(tx, lecturerId, appointmentId);
    requireStatus(a.status, ACTIVE_STATUSES);
    await transition(tx, a.id, ACTIVE_STATUSES, { status: "CANCELLED", remarks: reason });
    await releaseSlot(tx, a.slotId);
  }, LOCKED_TX);
}

/**
 * FR11 reschedule (SD8 steps 8-16, BR4): one transaction books the new slot, frees the old one and
 * marks the appointment RESCHEDULED. Allowed from PENDING, APPROVED and RESCHEDULED (decision 2026-10-14).
 * Consultation limits are not re-checked (decision log).
 */
export async function rescheduleAppointment(lecturerId: string, appointmentId: number, newSlotId: number, reason: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const a = await loadOwn(tx, lecturerId, appointmentId);
    requireStatus(a.status, ACTIVE_STATUSES);

    const target = await tx.availabilitySlot.findFirst({ where: { id: newSlotId, lecturerId } });
    if (!target || target.id === a.slotId) {
      throw new AppointmentActionError("slot-invalid", "Choose one of your other open slots.", "newSlotId");
    }
    if (slotStartsAt(target.slotDate, target.startTime) <= now) {
      throw new AppointmentActionError("slot-invalid", "That slot has already started. Choose a later one.", "newSlotId");
    }
    const claimed = await tx.availabilitySlot.updateMany({ where: { id: target.id, slotStatus: "AVAILABLE" }, data: { slotStatus: "BOOKED" } });
    if (claimed.count !== 1) {
      throw new AppointmentActionError("slot-taken", "That slot was just taken. Choose another one.", "newSlotId");
    }
    await releaseSlot(tx, a.slotId);
    await transition(tx, a.id, ACTIVE_STATUSES, { status: "RESCHEDULED", remarks: reason, slotId: target.id });
  }, LOCKED_TX);
}

/**
 * FR12 record consultation notes (SD9, BR6): APPROVED / RESCHEDULED become COMPLETED.
 * Only once the consultation has started (decision 2026-10-14). On a COMPLETED appointment this edits
 * the existing note (updateNote in the class diagram).
 */
export async function saveNote(lecturerId: string, appointmentId: number, notes: string, actionPlan: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const a = await loadOwn(tx, lecturerId, appointmentId);
    const plan = actionPlan.trim() || null;

    if (a.status === "COMPLETED" && a.note) {
      await tx.consultationNote.update({ where: { appointmentId: a.id }, data: { notes, actionPlan: plan } });
      return { completed: false };
    }
    requireStatus(a.status, ["APPROVED", "RESCHEDULED"]);
    if (slotStartsAt(a.slot.slotDate, a.slot.startTime) > now) {
      throw new AppointmentActionError("not-started", "You can record notes once the consultation has started.", "notes");
    }
    await tx.consultationNote.create({ data: { appointmentId: a.id, notes, actionPlan: plan } });
    await transition(tx, a.id, ["APPROVED", "RESCHEDULED"], { status: "COMPLETED" });
    return { completed: true };
  }, LOCKED_TX);
}
