import { Prisma } from "@/generated/prisma/client";
import { ACTIVE_STATUSES, appointmentCode, LIMIT_STATUSES } from "@/lib/appointment";
import { formatSlotDate, slotStartsAt, weekRange } from "@/lib/dates";
import { DEFAULT_LIMIT } from "@/lib/limits";
import { formatMinutes, minutesOf, overlaps } from "@/lib/slot-time";
import { prisma } from "@/server/db";
import { LOCKED_TX, lockLecturer, lockStudent } from "./locks";

type Tx = Prisma.TransactionClient;

export type BookingErrorCode =
  | "invalid-student-id"
  | "slot-not-found"
  | "slot-taken"
  | "slot-past"
  | "too-soon"
  | "day-full"
  | "week-full"
  | "student-week-full"
  | "student-clash";

/** A booking rule said no. `field` says which input the message belongs under. */
export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    message: string,
    readonly field?: "studentId" | "slotId",
  ) {
    super(message);
  }
}

type LimitCheck = {
  lecturerId: string;
  lecturerName: string;
  studentId: string;
  slotDate: Date;
  startsAt: Date;
  now: Date;
};

/**
 * LimitController.checkConsultationLimit (FR13 / BR2), run inside the booking transaction.
 * Counts are by the slot's date (decision log), using PENDING, APPROVED, RESCHEDULED and COMPLETED.
 * Skipped entirely when the lecturer has switched limits off.
 */
export async function checkConsultationLimit(tx: Tx, c: LimitCheck) {
  // No saved settings yet means the defaults apply, the same values the lecturer sees on the limits page.
  const limit = (await tx.consultationLimit.findUnique({ where: { lecturerId: c.lecturerId } })) ?? DEFAULT_LIMIT;
  if (!limit.isEnabled) return;

  const hoursAhead = (c.startsAt.getTime() - c.now.getTime()) / 3_600_000;
  if (hoursAhead < limit.minNoticeHours) {
    throw new BookingError(
      "too-soon",
      `${c.lecturerName} needs at least ${limit.minNoticeHours} hours notice. Choose a later slot.`,
      "slotId",
    );
  }

  const counted = { lecturerId: c.lecturerId, status: { in: [...LIMIT_STATUSES] } };
  const week = weekRange(c.slotDate);
  const [day, inWeek, studentInWeek] = await Promise.all([
    tx.appointment.count({ where: { ...counted, slot: { slotDate: c.slotDate } } }),
    tx.appointment.count({ where: { ...counted, slot: { slotDate: { gte: week.start, lt: week.end } } } }),
    tx.appointment.count({ where: { ...counted, studentId: c.studentId, slot: { slotDate: { gte: week.start, lt: week.end } } } }),
  ]);

  if (studentInWeek >= limit.maxPerStudentWeek) {
    throw new BookingError(
      "student-week-full",
      `You already have ${studentInWeek} booking${studentInWeek === 1 ? "" : "s"} with ${c.lecturerName} in the week of ${formatSlotDate(week.start)}. The limit is ${limit.maxPerStudentWeek} per student per week, so choose a slot in another week.`,
      "slotId",
    );
  }
  if (day >= limit.maxPerDay) {
    throw new BookingError("day-full", `${c.lecturerName} is fully booked on ${formatSlotDate(c.slotDate)} (${limit.maxPerDay} per day). Choose another day.`, "slotId");
  }
  if (inWeek >= limit.maxPerWeek) {
    throw new BookingError(
      "week-full",
      `${c.lecturerName} is fully booked in the week of ${formatSlotDate(week.start)} (${limit.maxPerWeek} per week). Choose a slot in another week.`,
      "slotId",
    );
  }
}

/**
 * The student's own active appointment (any lecturer) that overlaps this time, if any. A student can't be
 * in two consultations at once (decision 2026-10-23). Callers hold lockStudent, so the answer can't go stale.
 */
export async function findStudentClash(
  tx: Tx,
  c: { studentId: string; slotDate: Date; startTime: Date; endTime: Date; exceptAppointmentId?: number },
) {
  const sameDay = await tx.appointment.findMany({
    where: {
      studentId: c.studentId,
      status: { in: [...ACTIVE_STATUSES] },
      slot: { slotDate: c.slotDate },
      ...(c.exceptAppointmentId ? { id: { not: c.exceptAppointmentId } } : {}),
    },
    select: { id: true, slot: { select: { startTime: true, endTime: true } }, lecturer: { select: { user: { select: { name: true } } } } },
  });
  const wanted = { start: minutesOf(c.startTime), end: minutesOf(c.endTime) };
  const clash = sameDay.find((a) => overlaps(wanted, { start: minutesOf(a.slot.startTime), end: minutesOf(a.slot.endTime) }));
  return clash
    ? `${appointmentCode(clash.id)} with ${clash.lecturer.user.name}, ${formatMinutes(minutesOf(clash.slot.startTime))} - ${formatMinutes(minutesOf(clash.slot.endTime))}`
    : null;
}

/**
 * AppointmentController.submitBooking (FR05, BR1, BR2), following SD3:
 * verify student ID -> check slot status -> check consultation limit -> insert PENDING -> slot BOOKED.
 *
 * Race safety (two students, one slot, same instant):
 * - a transaction-scoped advisory lock per lecturer serialises bookings for that lecturer, so the
 *   limit counts can't be read by two bookings at once;
 * - the slot is only flipped with `updateMany ... where slot_status = AVAILABLE`, and anything but
 *   exactly 1 updated row rolls the whole booking back;
 * - the partial unique index on appointments(slot_id) is the last line of defence.
 * A per-student lock (taken first) keeps one student from booking two overlapping slots with different
 * lecturers at the same instant.
 */
export async function submitBooking(input: { userId: number; studentIdInput: string; slotId: number; purpose: string }, now = new Date()) {
  const student = await prisma.student.findUnique({ where: { userId: input.userId }, select: { studentId: true } });

  // «include» Insert Student ID (SD3 step 11): it must be the signed-in student's own ID.
  if (!student || student.studentId !== input.studentIdInput) {
    throw new BookingError("invalid-student-id", "Invalid Student ID. Enter your own student ID.", "studentId");
  }

  // Students may book any active lecturer (decision 2026-10-21), so the lecturer comes from the chosen slot.
  const gone = new BookingError("slot-not-found", "That slot is no longer offered. Please choose again.", "slotId");
  const target = await prisma.availabilitySlot.findUnique({
    where: { id: input.slotId },
    select: { lecturerId: true, lecturer: { select: { user: { select: { name: true } } } } },
  });
  if (!target) throw gone;
  const lecturerId = target.lecturerId;
  const lecturerName = target.lecturer.user.name;

  try {
    return await prisma.$transaction(async (tx) => {
      await lockStudent(tx, student.studentId);
      await lockLecturer(tx, lecturerId);

      // Re-read under the lock: deactivating a lecturer takes the same lock (SD12).
      const lecturer = await tx.lecturer.findUnique({ where: { lecturerId }, select: { user: { select: { accountStatus: true } } } });
      const slot = await tx.availabilitySlot.findUnique({ where: { id: input.slotId } });
      if (!slot || slot.lecturerId !== lecturerId || lecturer?.user.accountStatus !== "ACTIVE") throw gone;
      if (slot.slotStatus !== "AVAILABLE") {
        throw new BookingError("slot-taken", "Sorry, that slot has just been taken. Please choose another slot.", "slotId");
      }
      const startsAt = slotStartsAt(slot.slotDate, slot.startTime);
      if (startsAt <= now) {
        throw new BookingError("slot-past", "That slot has already started. Please choose a later one.", "slotId");
      }

      const clash = await findStudentClash(tx, { studentId: student.studentId, slotDate: slot.slotDate, startTime: slot.startTime, endTime: slot.endTime });
      if (clash) {
        throw new BookingError("student-clash", `You already have a consultation at that time (${clash}). Choose another slot.`, "slotId");
      }

      await checkConsultationLimit(tx, { lecturerId, lecturerName, studentId: student.studentId, slotDate: slot.slotDate, startsAt, now });

      const appointment = await tx.appointment.create({
        data: { studentId: student.studentId, lecturerId, slotId: slot.id, purpose: input.purpose, status: "PENDING" },
        select: { id: true },
      });

      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slot.id, slotStatus: "AVAILABLE" },
        data: { slotStatus: "BOOKED" },
      });
      if (claimed.count !== 1) {
        throw new BookingError("slot-taken", "Sorry, that slot has just been taken. Please choose another slot.", "slotId");
      }
      return appointment;
    }, LOCKED_TX);
  } catch (error) {
    // The partial unique index caught a double booking that slipped past everything else.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BookingError("slot-taken", "Sorry, that slot has just been taken. Please choose another slot.", "slotId");
    }
    throw error;
  }
}
