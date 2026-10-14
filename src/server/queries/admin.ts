import type { AccountStatus, Prisma } from "@/generated/prisma/client";
import { malaysiaToday, weekRange } from "@/lib/dates";
import { prisma } from "@/server/db";

// Read side of the admin module (StudentController.getStudentList, LecturerController.getLecturerList).

export const PAGE_SIZE = 20;

export type ListQuery = { q: string; status: AccountStatus | "ALL"; page: number };

/** Normalise ?q=&status=&page= from the URL. */
export function parseListQuery(params: Record<string, string | string[] | undefined>): ListQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const status = one(params.status).toUpperCase();
  const page = Math.max(1, Math.floor(Number(one(params.page)) || 1));
  return {
    q: one(params.q).trim().slice(0, 100),
    status: status === "INACTIVE" || status === "ALL" ? status : "ACTIVE",
    page,
  };
}

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** FR14 list + search (SD11 steps 2-6). Search matches student ID, name or e-mail. */
export async function getStudentList({ q, status, page }: ListQuery) {
  const where: Prisma.StudentWhereInput = {
    ...(status === "ALL" ? {} : { user: { accountStatus: status } }),
    ...(q ? { OR: [{ studentId: contains(q) }, { user: { name: contains(q) } }, { user: { email: contains(q) } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { studentId: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        studentId: true,
        programme: true,
        semester: true,
        user: { select: { id: true, name: true, email: true, accountStatus: true } },
        lecturer: { select: { lecturerId: true, user: { select: { name: true } } } },
      },
    }),
  ]);
  return { total, rows };
}

/** FR15 list + search (SD12). Search matches lecturer ID, name, e-mail or department. */
export async function getLecturerList({ q, status, page }: ListQuery) {
  const where: Prisma.LecturerWhereInput = {
    ...(status === "ALL" ? {} : { user: { accountStatus: status } }),
    ...(q
      ? { OR: [{ lecturerId: contains(q) }, { department: contains(q) }, { user: { name: contains(q) } }, { user: { email: contains(q) } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.lecturer.count({ where }),
    prisma.lecturer.findMany({
      where,
      orderBy: { lecturerId: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        lecturerId: true,
        department: true,
        officeRoom: true,
        user: { select: { id: true, name: true, email: true, accountStatus: true } },
        _count: { select: { students: true } },
      },
    }),
  ]);
  return { total, rows };
}

/** One student for the edit page. */
export function getStudentForEdit(studentId: string) {
  return prisma.student.findUnique({
    where: { studentId },
    select: {
      studentId: true,
      programme: true,
      semester: true,
      faculty: true,
      lecturerId: true,
      user: { select: { id: true, name: true, email: true, phoneNo: true, accountStatus: true, createdAt: true } },
      _count: { select: { appointments: true } },
    },
  });
}

/** One lecturer for the edit page. */
export function getLecturerForEdit(lecturerId: string) {
  return prisma.lecturer.findUnique({
    where: { lecturerId },
    select: {
      lecturerId: true,
      department: true,
      officeRoom: true,
      position: true,
      user: { select: { id: true, name: true, email: true, phoneNo: true, accountStatus: true, createdAt: true } },
      _count: { select: { appointments: true } },
    },
  });
}

/** Lecturers a student can be assigned to: active ones only, with their department (decision 2026-10-14). */
export function getLecturerOptions() {
  return prisma.lecturer.findMany({
    where: { user: { accountStatus: "ACTIVE" } },
    orderBy: { user: { name: "asc" } },
    select: { lecturerId: true, department: true, user: { select: { name: true } } },
  });
}

/** Admin dashboard counters. "This week" counts appointments by slot date, leaving out rejected and cancelled ones. */
export async function getAdminDashboard(now = new Date()) {
  const week = weekRange(malaysiaToday(now));
  const [students, lecturers, thisWeek, pending, unassigned] = await Promise.all([
    prisma.student.count({ where: { user: { accountStatus: "ACTIVE" } } }),
    prisma.lecturer.count({ where: { user: { accountStatus: "ACTIVE" } } }),
    prisma.appointment.count({
      where: { status: { notIn: ["REJECTED", "CANCELLED"] }, slot: { slotDate: { gte: week.start, lt: week.end } } },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.student.count({ where: { lecturerId: null, user: { accountStatus: "ACTIVE" } } }),
  ]);
  return { students, lecturers, thisWeek, pending, unassigned, weekStart: week.start };
}
