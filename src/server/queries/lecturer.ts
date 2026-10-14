import type { AppointmentStatus } from "@/generated/prisma/client";
import { addDays, malaysiaToday, slotStartsAt, weekRange } from "@/lib/dates";
import { prisma } from "@/server/db";

// Read side of the lecturer module. Every query is scoped to one lecturer_id, so a lecturer only
// ever sees their own slots, requests and notes (NFR03).
//
// The lecturer's lists split appointments by status, not by date:
//   Booking Requests = PENDING, Appointments = APPROVED / RESCHEDULED, History = finished
//   (COMPLETED / REJECTED / CANCELLED). So a consultation that happened yesterday but has no
//   notes yet still sits in Appointments, where the lecturer records them.

export const FINISHED_STATUSES = ["COMPLETED", "REJECTED", "CANCELLED"] as const satisfies readonly AppointmentStatus[];

/** The lecturer record behind a signed-in user. */
export async function getLecturerForUser(userId: number) {
  return prisma.lecturer.findUnique({
    where: { userId },
    select: {
      lecturerId: true,
      department: true,
      officeRoom: true,
      position: true,
      user: { select: { name: true, email: true, phoneNo: true } },
    },
  });
}

const rowSelect = {
  id: true,
  purpose: true,
  status: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  slot: { select: { id: true, slotDate: true, startTime: true, endTime: true, location: true } },
  student: { select: { studentId: true, programme: true, user: { select: { name: true } } } },
} as const;

/** FR10 «include» View Booking Appointment (SD7 steps 2-6): pending requests, soonest first. */
export function getPendingRequests(lecturerId: string) {
  return prisma.appointment.findMany({
    where: { lecturerId, status: "PENDING" },
    orderBy: [{ slot: { slotDate: "asc" } }, { slot: { startTime: "asc" } }],
    select: rowSelect,
  });
}

export type LecturerRow = Awaited<ReturnType<typeof getPendingRequests>>[number];

/** Confirmed appointments (APPROVED / RESCHEDULED), split into "needs notes" (already started) and upcoming. */
export async function getActiveAppointments(lecturerId: string, now = new Date()) {
  const rows = await prisma.appointment.findMany({
    where: { lecturerId, status: { in: ["APPROVED", "RESCHEDULED"] } },
    orderBy: [{ slot: { slotDate: "asc" } }, { slot: { startTime: "asc" } }],
    select: rowSelect,
  });
  const started = (r: LecturerRow) => slotStartsAt(r.slot.slotDate, r.slot.startTime) <= now;
  return { needsNotes: rows.filter(started), upcoming: rows.filter((r) => !started(r)) };
}

/** FR08 history for the lecturer (SD5): finished appointments, newest first. */
export function getLecturerHistory(lecturerId: string) {
  return prisma.appointment.findMany({
    where: { lecturerId, status: { in: [...FINISHED_STATUSES] } },
    orderBy: [{ slot: { slotDate: "desc" } }, { slot: { startTime: "desc" } }],
    select: rowSelect,
  });
}

/** One appointment with the student's contact details and the note. Null unless it belongs to this lecturer. */
export async function getLecturerAppointment(lecturerId: string, appointmentId: number) {
  if (!Number.isInteger(appointmentId) || appointmentId < 1) return null;
  return prisma.appointment.findFirst({
    where: { id: appointmentId, lecturerId },
    select: {
      ...rowSelect,
      student: {
        select: { studentId: true, programme: true, semester: true, user: { select: { name: true, email: true, phoneNo: true } } },
      },
      note: { select: { notes: true, actionPlan: true, recordedAt: true } },
    },
  });
}

export type LecturerAppointment = NonNullable<Awaited<ReturnType<typeof getLecturerAppointment>>>;

/** Open slots a request can be moved to (FR11 «include» Select Date & Time, SD8 steps 2-5): future AVAILABLE ones. */
export async function getRescheduleOptions(lecturerId: string, now = new Date()) {
  const today = malaysiaToday(now);
  const slots = await prisma.availabilitySlot.findMany({
    where: { lecturerId, slotStatus: "AVAILABLE", slotDate: { gte: today, lt: addDays(today, 56) } },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    select: { id: true, slotDate: true, startTime: true, endTime: true, location: true },
  });
  return slots.filter((s) => slotStartsAt(s.slotDate, s.startTime) > now);
}

/**
 * SlotController.getMySlots (FR09, SD6): today onwards, every status, with what is booked on it
 * and whether it has appointment history (which locks its date, time and location).
 */
export async function getMySlots(lecturerId: string, now = new Date()) {
  const today = malaysiaToday(now);
  const slots = await prisma.availabilitySlot.findMany({
    where: { lecturerId, slotDate: { gte: today } },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      slotDate: true,
      startTime: true,
      endTime: true,
      location: true,
      slotStatus: true,
      _count: { select: { appointments: true } },
      appointments: {
        where: { status: { in: ["PENDING", "APPROVED", "RESCHEDULED"] } },
        select: { id: true, status: true, student: { select: { user: { select: { name: true } } } } },
        take: 1,
      },
    },
  });
  return slots.map((s) => ({
    id: s.id,
    slotDate: s.slotDate,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    status: s.slotStatus,
    started: slotStartsAt(s.slotDate, s.startTime) <= now,
    hasHistory: s._count.appointments > 0,
    booking: s.appointments[0] ? { id: s.appointments[0].id, status: s.appointments[0].status, studentName: s.appointments[0].student.user.name } : null,
  }));
}

export type MySlot = Awaited<ReturnType<typeof getMySlots>>[number];

/** Lecturer dashboard counters and today's list. */
export async function getLecturerDashboard(lecturerId: string, now = new Date()) {
  const today = malaysiaToday(now);
  const week = weekRange(today);
  const [pending, todayList, openSlots, active] = await Promise.all([
    prisma.appointment.count({ where: { lecturerId, status: "PENDING" } }),
    prisma.appointment.findMany({
      where: { lecturerId, status: { in: ["APPROVED", "RESCHEDULED", "COMPLETED"] }, slot: { slotDate: today } },
      orderBy: { slot: { startTime: "asc" } },
      select: rowSelect,
    }),
    prisma.availabilitySlot.findMany({
      where: { lecturerId, slotStatus: "AVAILABLE", slotDate: { gte: today, lt: week.end } },
      select: { slotDate: true, startTime: true },
    }),
    getActiveAppointments(lecturerId, now),
  ]);
  return {
    pending,
    today: todayList,
    openThisWeek: openSlots.filter((s) => slotStartsAt(s.slotDate, s.startTime) > now).length,
    needsNotes: active.needsNotes.length,
  };
}
