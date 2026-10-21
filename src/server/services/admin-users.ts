import { Prisma } from "@/generated/prisma/client";
import { ACTIVE_STATUSES } from "@/lib/appointment";
import { hashPassword } from "@/lib/auth/password";
import { slotStartsAt } from "@/lib/dates";
import { parseStudentId } from "@/lib/student-id";
import type { CreateLecturerInput, CreateStudentInput, UpdateLecturerInput, UpdateStudentInput } from "@/lib/validation/admin";
import { prisma } from "@/server/db";
import { LOCKED_TX, lockLecturer } from "./locks";

// StudentController.saveStudent / deleteStudent and LecturerController.saveLecturer / deleteLecturer
// (FR14, FR15, SD11, SD12). "delete" is always a soft delete: account_status = INACTIVE (BR8).

type Field = "studentId" | "lecturerId" | "email" | "name";

export class AdminError extends Error {
  constructor(
    readonly code: "not-found" | "duplicate" | "locked" | "blocked" | "invalid",
    message: string,
    readonly field?: Field,
  ) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

async function assertEmailFree(tx: Tx, email: string, exceptUserId?: number) {
  const taken = await tx.user.findUnique({ where: { email }, select: { id: true } });
  if (taken && taken.id !== exceptUserId) throw new AdminError("duplicate", "This e-mail is already used by another account.", "email");
}

/** The P2002 safety net: two admins saving the same ID or e-mail at the same moment. */
function duplicateFrom(error: unknown, idField: "studentId" | "lecturerId"): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AdminError("duplicate", "This ID or e-mail is already in use.", idField);
  }
  throw error;
}

// ---------------------------------------------------------------- students (FR14)

/** SD11 steps 8-12: checkStudentId (unique) then insert. Programme comes from the ID code. */
export async function createStudent(input: CreateStudentInput) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.$transaction(async (tx) => {
      await assertEmailFree(tx, input.email);
      if (await tx.student.findUnique({ where: { studentId: input.studentId }, select: { studentId: true } })) {
        throw new AdminError("duplicate", "This student ID is already registered.", "studentId");
      }
      const student = await tx.student.create({
        data: {
          studentId: input.studentId,
          programme: parseStudentId(input.studentId)?.programme,
          semester: input.semester ?? null,
          faculty: input.faculty ?? null,
          user: { create: { name: input.name, email: input.email, phoneNo: input.phoneNo ?? null, passwordHash, role: "STUDENT" as const } },
        },
        select: { studentId: true },
      });
      return student;
    });
  } catch (error) {
    if (error instanceof AdminError) throw error;
    duplicateFrom(error, "studentId");
  }
}

/** SD11 steps 8-12 (update). The Student ID can change only while the student has no appointments (decision 2026-10-14). */
export async function updateStudent(input: UpdateStudentInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.student.findUnique({
        where: { studentId: input.originalStudentId },
        select: { studentId: true, userId: true, _count: { select: { appointments: true } } },
      });
      if (!current) throw new AdminError("not-found", "This student no longer exists.");
      await assertEmailFree(tx, input.email, current.userId);

      if (input.studentId !== current.studentId) {
        if (current._count.appointments > 0) {
          throw new AdminError("locked", "This student already has appointments, so the Student ID can't change.", "studentId");
        }
        if (await tx.student.findUnique({ where: { studentId: input.studentId }, select: { studentId: true } })) {
          throw new AdminError("duplicate", "This student ID is already registered.", "studentId");
        }
      }
      await tx.user.update({ where: { id: current.userId }, data: { name: input.name, email: input.email, phoneNo: input.phoneNo ?? null } });
      return tx.student.update({
        where: { studentId: current.studentId },
        data: {
          studentId: input.studentId,
          programme: parseStudentId(input.studentId)?.programme,
          semester: input.semester ?? null,
          faculty: input.faculty ?? null,
        },
        select: { studentId: true },
      });
    });
  } catch (error) {
    if (error instanceof AdminError) throw error;
    duplicateFrom(error, "studentId");
  }
}

/** Appointments a deactivation would cancel: active ones whose consultation hasn't started yet. */
async function upcomingActive(tx: Tx | typeof prisma, studentId: string, now: Date) {
  const rows = await tx.appointment.findMany({
    where: { studentId, status: { in: [...ACTIVE_STATUSES] } },
    select: { id: true, lecturerId: true, slotId: true, slot: { select: { slotDate: true, startTime: true } } },
  });
  return rows.filter((r) => slotStartsAt(r.slot.slotDate, r.slot.startTime) > now);
}

/** For the confirmation dialog: how many appointments deactivating this student would cancel. */
export async function previewStudentDeactivation(studentId: string, now = new Date()) {
  return (await upcomingActive(prisma, studentId, now)).length;
}

export const STUDENT_DEACTIVATED_REMARK = "Student account deactivated by the admin office.";

/**
 * StudentController.deleteStudent = deactivate (SD11 opt, BR8). In one transaction: cancel the student's
 * upcoming active appointments, free their slots and set the account INACTIVE (decision 2026-10-14).
 * Takes the lock of every lecturer involved (in a fixed order) so it can't race with bookings.
 */
export async function deactivateStudent(studentId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { studentId }, select: { userId: true } });
    if (!student) throw new AdminError("not-found", "This student no longer exists.");

    const lecturers = [...new Set((await upcomingActive(tx, studentId, now)).map((a) => a.lecturerId))].sort();
    for (const lecturerId of lecturers) await lockLecturer(tx, lecturerId);
    const toCancel = await upcomingActive(tx, studentId, now); // re-read under the locks

    for (const a of toCancel) {
      await tx.appointment.updateMany({
        where: { id: a.id, status: { in: [...ACTIVE_STATUSES] } },
        data: { status: "CANCELLED", remarks: STUDENT_DEACTIVATED_REMARK },
      });
      await tx.availabilitySlot.updateMany({ where: { id: a.slotId, slotStatus: "BOOKED" }, data: { slotStatus: "AVAILABLE" } });
    }
    await tx.user.update({ where: { id: student.userId }, data: { accountStatus: "INACTIVE" } });
    return { cancelled: toCancel.length };
  }, LOCKED_TX);
}

// ---------------------------------------------------------------- lecturers (FR15)

/** SD12: checkLecturerId (unique) then insert. No limit row yet: the defaults apply until they save their own. */
export async function createLecturer(input: CreateLecturerInput) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.$transaction(async (tx) => {
      await assertEmailFree(tx, input.email);
      if (await tx.lecturer.findUnique({ where: { lecturerId: input.lecturerId }, select: { lecturerId: true } })) {
        throw new AdminError("duplicate", "This lecturer ID is already registered.", "lecturerId");
      }
      return tx.lecturer.create({
        data: {
          lecturerId: input.lecturerId,
          department: input.department,
          officeRoom: input.officeRoom,
          position: input.position ?? null,
          user: { create: { name: input.name, email: input.email, phoneNo: input.phoneNo ?? null, passwordHash, role: "LECTURER" as const } },
        },
        select: { lecturerId: true },
      });
    });
  } catch (error) {
    if (error instanceof AdminError) throw error;
    duplicateFrom(error, "lecturerId");
  }
}

/** SD12 update. The Lecturer ID can change only while the lecturer has no appointments (decision 2026-10-14). */
export async function updateLecturer(input: UpdateLecturerInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.lecturer.findUnique({
        where: { lecturerId: input.originalLecturerId },
        select: { lecturerId: true, userId: true, _count: { select: { appointments: true } } },
      });
      if (!current) throw new AdminError("not-found", "This lecturer no longer exists.");
      await assertEmailFree(tx, input.email, current.userId);
      if (input.lecturerId !== current.lecturerId) {
        if (current._count.appointments > 0) {
          throw new AdminError("locked", "This lecturer already has appointments, so the Lecturer ID can't change.", "lecturerId");
        }
        if (await tx.lecturer.findUnique({ where: { lecturerId: input.lecturerId }, select: { lecturerId: true } })) {
          throw new AdminError("duplicate", "This lecturer ID is already registered.", "lecturerId");
        }
      }
      await tx.user.update({ where: { id: current.userId }, data: { name: input.name, email: input.email, phoneNo: input.phoneNo ?? null } });
      // Students, slots and limits follow a changed ID through ON UPDATE CASCADE.
      return tx.lecturer.update({
        where: { lecturerId: current.lecturerId },
        data: { lecturerId: input.lecturerId, department: input.department, officeRoom: input.officeRoom, position: input.position ?? null },
        select: { lecturerId: true },
      });
    });
  } catch (error) {
    if (error instanceof AdminError) throw error;
    duplicateFrom(error, "lecturerId");
  }
}

/**
 * What stops a lecturer being deactivated (decision log): active appointments. Students are no longer
 * assigned to one lecturer (decision 2026-10-21), so they don't block it.
 */
export async function lecturerBlockers(lecturerId: string, tx: Tx | typeof prisma = prisma) {
  const activeAppointments = await tx.appointment.count({ where: { lecturerId, status: { in: [...ACTIVE_STATUSES] } } });
  return { activeAppointments };
}

export function blockerMessage(name: string, b: { activeAppointments: number }) {
  const n = b.activeAppointments;
  return `${name} still has ${n} active appointment${n === 1 ? "" : "s"}. To deactivate, first have the lecturer complete, reject or cancel ${n === 1 ? "that appointment" : "those appointments"}.`;
}

/** LecturerController.deleteLecturer = deactivate (SD12 opt, BR8), blocked while anything still depends on them. */
export async function deactivateLecturer(lecturerId: string) {
  return prisma.$transaction(async (tx) => {
    const lecturer = await tx.lecturer.findUnique({ where: { lecturerId }, select: { userId: true, user: { select: { name: true } } } });
    if (!lecturer) throw new AdminError("not-found", "This lecturer no longer exists.");
    await lockLecturer(tx, lecturerId); // no booking can slip in between the check and the update
    const blockers = await lecturerBlockers(lecturerId, tx);
    if (blockers.activeAppointments) {
      throw new AdminError("blocked", blockerMessage(lecturer.user.name, blockers));
    }
    await tx.user.update({ where: { id: lecturer.userId }, data: { accountStatus: "INACTIVE" } });
  }, LOCKED_TX);
}

// ---------------------------------------------------------------- shared

/** Reactivate a student or lecturer account. Admin accounts are not managed here. */
export async function reactivateUser(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role === "ADMIN") throw new AdminError("not-found", "This account no longer exists.");
  await prisma.user.update({ where: { id: userId }, data: { accountStatus: "ACTIVE" } });
}

/** Set a new temporary password (there is no "forgot password"). */
export async function resetPassword(userId: number, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role === "ADMIN") throw new AdminError("not-found", "This account no longer exists.");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
}
