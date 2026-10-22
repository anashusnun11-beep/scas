import { ACTIVE_STATUSES } from "@/lib/appointment";
import { addDays, malaysiaToday, slotStartsAt } from "@/lib/dates";
import { DEFAULT_LIMIT } from "@/lib/limits";
import { prisma } from "@/server/db";

// Read side of the student module. Names follow the SDD controllers:
// LecturerController.getLecturerList, SlotController.getAvailableSlots,
// AppointmentController.getMyAppointments / getHistory, NoteController.getAppointment.
// Functions that read appointments take the signed-in user's id, so a student can only ever read their own (NFR03).
// Students may consult any active lecturer (decision 2026-10-21); students.lecturer_id is no longer used.

/** How far ahead students can see and book slots. */
export const BOOKING_WINDOW_DAYS = 28;

const lecturerSelect = {
  lecturerId: true,
  department: true,
  officeRoom: true,
  position: true,
  user: { select: { name: true, email: true, phoneNo: true } },
  limit: { select: { isEnabled: true, minNoticeHours: true } },
} as const;

type NoticeLimit = { isEnabled: boolean; minNoticeHours: number } | null;

/** The minimum notice in ms (0 when the lecturer has switched limits off); no saved limits = defaults. */
function noticeFor(limit: NoticeLimit) {
  const effective = limit ?? DEFAULT_LIMIT;
  return { hours: effective.minNoticeHours, ms: effective.isEnabled ? effective.minNoticeHours * 60 * 60 * 1000 : 0 };
}

/** The signed-in student's own record (profile page). */
export function getStudentProfile(userId: number) {
  return prisma.student.findUnique({
    where: { userId },
    select: {
      studentId: true,
      programme: true,
      semester: true,
      user: { select: { name: true, email: true, phoneNo: true } },
    },
  });
}

/** FR03: one active lecturer's details, or null (unknown or deactivated). */
export function getLecturerForStudent(lecturerId: string) {
  return prisma.lecturer.findFirst({
    where: { lecturerId, user: { accountStatus: "ACTIVE" } },
    select: lecturerSelect,
  });
}

export type LecturerDetails = NonNullable<Awaited<ReturnType<typeof getLecturerForStudent>>>;

/** The lecturer a slot belongs to, so `/student/book?slot=` can open the right lecturer's form. */
export async function getSlotLecturerId(slotId: number) {
  if (!Number.isInteger(slotId) || slotId < 1) return null;
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId }, select: { lecturerId: true } });
  return slot?.lecturerId ?? null;
}

/**
 * FR03 for every lecturer: all ACTIVE lecturers (including those with no slots yet), each with how many
 * slots a student can book right now and the earliest one. Sorted by name.
 */
export async function getLecturerDirectory(now = new Date()) {
  const today = malaysiaToday(now);
  const lecturers = await prisma.lecturer.findMany({
    where: { user: { accountStatus: "ACTIVE" } },
    orderBy: { user: { name: "asc" } },
    select: lecturerSelect,
  });
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      lecturerId: { in: lecturers.map((l) => l.lecturerId) },
      slotStatus: "AVAILABLE",
      slotDate: { gte: today, lt: addDays(today, BOOKING_WINDOW_DAYS) },
    },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    select: { lecturerId: true, slotDate: true, startTime: true, endTime: true },
  });

  return lecturers.map((lecturer) => {
    const notice = noticeFor(lecturer.limit);
    const open = slots.filter(
      (s) => s.lecturerId === lecturer.lecturerId && slotStartsAt(s.slotDate, s.startTime).getTime() - now.getTime() >= notice.ms,
    );
    return { ...lecturer, openSlots: open.length, nextSlot: open[0] ?? null };
  });
}

export type LecturerDirectoryEntry = Awaited<ReturnType<typeof getLecturerDirectory>>[number];

export type SlotView = {
  id: number;
  slotDate: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  status: "AVAILABLE" | "BOOKED";
  /** Why an AVAILABLE slot can't be booked right now (inside the minimum notice period). */
  closedReason?: string;
};

/**
 * FR04: the lecturer's slots from now until the end of the booking window.
 * AVAILABLE slots are bookable; BOOKED ones are returned so the UI can show them crossed out
 * (SDD 6.2). Past slots and UNAVAILABLE ones are left out.
 */
export async function getAvailableSlots(lecturerId: string, limit: NoticeLimit, now = new Date()): Promise<SlotView[]> {
  const today = malaysiaToday(now);
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      lecturerId,
      slotStatus: { in: ["AVAILABLE", "BOOKED"] },
      slotDate: { gte: today, lt: addDays(today, BOOKING_WINDOW_DAYS) },
    },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    select: { id: true, slotDate: true, startTime: true, endTime: true, location: true, slotStatus: true },
  });

  const notice = noticeFor(limit);
  return slots
    .filter((s) => slotStartsAt(s.slotDate, s.startTime) > now)
    .map((s) => {
      const startsAt = slotStartsAt(s.slotDate, s.startTime);
      const tooSoon = s.slotStatus === "AVAILABLE" && startsAt.getTime() - now.getTime() < notice.ms;
      return {
        id: s.id,
        slotDate: s.slotDate,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
        status: s.slotStatus as "AVAILABLE" | "BOOKED",
        closedReason: tooSoon ? `Bookings close ${notice.hours} hours before` : undefined,
      };
    });
}

const appointmentSelect = {
  id: true,
  purpose: true,
  status: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  slot: { select: { slotDate: true, startTime: true, endTime: true, location: true } },
  lecturer: { select: { user: { select: { name: true } } } },
} as const;

/**
 * FR06 status page: appointments from today onwards, any status (decision: Status = today or later,
 * History = earlier). FR08 history page: everything before today.
 */
export async function getMyAppointments(userId: number, scope: "upcoming" | "past", now = new Date()) {
  const today = malaysiaToday(now);
  return prisma.appointment.findMany({
    where: {
      student: { userId },
      slot: { slotDate: scope === "upcoming" ? { gte: today } : { lt: today } },
    },
    orderBy: scope === "upcoming" ? [{ slot: { slotDate: "asc" } }, { slot: { startTime: "asc" } }] : [{ slot: { slotDate: "desc" } }, { slot: { startTime: "desc" } }],
    select: appointmentSelect,
  });
}

export type AppointmentRow = Awaited<ReturnType<typeof getMyAppointments>>[number];

/** FR08 history alias, named as in the SDD. */
export function getHistory(userId: number, now = new Date()) {
  return getMyAppointments(userId, "past", now);
}

/**
 * One appointment with its consultation note. Returns null unless it belongs to this student
 * (NFR03: notes are visible only to that student and that lecturer).
 */
export async function getAppointmentDetail(userId: number, appointmentId: number) {
  if (!Number.isInteger(appointmentId) || appointmentId < 1) return null;
  return prisma.appointment.findFirst({
    where: { id: appointmentId, student: { userId } },
    select: {
      ...appointmentSelect,
      note: { select: { notes: true, actionPlan: true, recordedAt: true } },
      student: { select: { studentId: true, programme: true, user: { select: { name: true } } } },
      lecturer: { select: { officeRoom: true, user: { select: { name: true, email: true } } } },
    },
  });
}

export type AppointmentDetail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetail>>>;

/** Dashboard counters (UI2). */
export async function getDashboardStats(userId: number, now = new Date()) {
  const today = malaysiaToday(now);
  const mine = { student: { userId } };
  const [upcoming, pending, approved, completed] = await Promise.all([
    prisma.appointment.count({ where: { ...mine, status: { in: [...ACTIVE_STATUSES] }, slot: { slotDate: { gte: today } } } }),
    prisma.appointment.count({ where: { ...mine, status: "PENDING" } }),
    prisma.appointment.count({ where: { ...mine, status: { in: ["APPROVED", "RESCHEDULED"] }, slot: { slotDate: { gte: today } } } }),
    prisma.appointment.count({ where: { ...mine, status: "COMPLETED" } }),
  ]);
  return { upcoming, pending, approved, completed };
}
