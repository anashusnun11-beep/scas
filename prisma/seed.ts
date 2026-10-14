// Development seed: 1 admin, 2 lecturers (with consultation limits and slots next week), 3 students.
// WARNING: this wipes every SCAS table first. Only run it against a development database.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseStudentId } from "../src/lib/student-id";

function programmeOf(studentId: string) {
  const parsed = parseStudentId(studentId);
  if (!parsed) throw new Error(`Seed student ID ${studentId} does not match the KPMB format`);
  return parsed.programme;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Demo-only password shared by every seeded account.
const DEMO_PASSWORD = "Scas@1234";
const TIME_ZONE = "Asia/Kuala_Lumpur";

/** Today's calendar date in Malaysia, as a UTC-midnight Date (how Prisma stores @db.Date). */
function todayInMalaysia(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}

/** Monday to Friday of next week (weeks run Monday to Sunday). */
function nextWeekdays(): Date[] {
  const today = todayInMalaysia();
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const nextMonday = new Date(today);
  nextMonday.setUTCDate(today.getUTCDate() - daysSinceMonday + 7);
  return Array.from({ length: 5 }, (_, i) => {
    const day = new Date(nextMonday);
    day.setUTCDate(nextMonday.getUTCDate() + i);
    return day;
  });
}

/** A wall-clock time for a @db.Time column. */
function time(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00Z`);
}

async function wipe() {
  await prisma.$transaction([
    prisma.consultationNote.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.availabilitySlot.deleteMany(),
    prisma.consultationLimit.deleteMany(),
    prisma.report.deleteMany(),
    prisma.student.deleteMany(),
    prisma.lecturer.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  await wipe();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.admin.create({
    data: {
      adminId: "ADM001",
      position: "System Administrator",
      user: {
        create: {
          name: "Siti Aminah binti Yusof",
          email: "admin@scas.test",
          passwordHash,
          phoneNo: "03-8925 0001",
          role: "ADMIN",
        },
      },
    },
  });

  const lecturers = [
    {
      lecturerId: "LEC001",
      name: "Dr. Nurul Huda binti Ismail",
      email: "nurulhuda@scas.test",
      phoneNo: "03-8925 1214",
      department: "Computer Science",
      officeRoom: "Block B, Level 2, Room 2.14",
      position: "Senior Lecturer",
      location: "Room B2.14",
      start: "10:00",
      end: "10:30",
    },
    {
      lecturerId: "LEC002",
      name: "En. Hafiz bin Rahim",
      email: "hafiz@scas.test",
      phoneNo: "03-8925 1305",
      department: "Accounting",
      officeRoom: "Block B, Level 3, Room 3.05",
      position: "Lecturer",
      location: "Room B3.05",
      start: "14:00",
      end: "14:30",
    },
  ];

  const weekdays = nextWeekdays();

  for (const l of lecturers) {
    await prisma.lecturer.create({
      data: {
        lecturerId: l.lecturerId,
        department: l.department,
        officeRoom: l.officeRoom,
        position: l.position,
        user: {
          create: {
            name: l.name,
            email: l.email,
            passwordHash,
            phoneNo: l.phoneNo,
            role: "LECTURER",
          },
        },
        // Schema defaults: 6/day, 20/week, 2/student/week, 30 min, 24 h notice, enabled.
        limit: { create: {} },
        slots: {
          create: weekdays.map((slotDate) => ({
            slotDate,
            startTime: time(l.start),
            endTime: time(l.end),
            location: l.location,
          })),
        },
      },
    });
  }

  // KPMB student ID format <CODE><YY><INTAKE>-<NNN>; programme comes from the code (src/lib/student-id.ts).
  const students = [
    { studentId: "BCS2403-001", name: "Aina Sofea binti Rahman", email: "aina@scas.test", lecturerId: "LEC001" },
    { studentId: "BCS2402-015", name: "Kavitha a/p Raman", email: "kavitha@scas.test", lecturerId: "LEC001" },
    { studentId: "BDA2401-007", name: "Lim Wei Jie", email: "weijie@scas.test", lecturerId: "LEC002" },
    // Deactivated account, to test that INACTIVE users cannot log in (BR8, module 2).
    { studentId: "BDB2401-031", name: "Nur Iman binti Zulkifli", email: "iman@scas.test", lecturerId: "LEC002", inactive: true },
  ];

  for (const s of students) {
    await prisma.student.create({
      data: {
        studentId: s.studentId,
        programme: programmeOf(s.studentId),
        semester: 4,
        lecturer: { connect: { lecturerId: s.lecturerId } },
        user: {
          create: {
            name: s.name,
            email: s.email,
            passwordHash,
            role: "STUDENT",
            accountStatus: s.inactive ? "INACTIVE" : "ACTIVE",
          },
        },
      },
    });
  }

  // Sample appointments for Aina (module 3 testing): one COMPLETED with notes and one REJECTED last
  // week (history), one APPROVED next week (status + printable slip). Kavitha and Wei Jie stay empty.
  const dayMs = 24 * 60 * 60 * 1000;
  const lastWeekTue = new Date(weekdays[1].getTime() - 14 * dayMs); // the week before this one: always in the past
  const lastWeekThu = new Date(weekdays[3].getTime() - 14 * dayMs);
  const past = (slotDate: Date) =>
    prisma.availabilitySlot.create({
      data: { lecturerId: "LEC001", slotDate, startTime: time("10:00"), endTime: time("10:30"), location: "Room B2.14" },
    });
  const [completedSlot, rejectedSlot] = [await past(lastWeekTue), await past(lastWeekThu)];

  await prisma.appointment.create({
    data: {
      studentId: "BCS2403-001",
      lecturerId: "LEC001",
      slotId: completedSlot.id,
      purpose: "Final year project proposal discussion",
      status: "COMPLETED",
      note: {
        create: {
          notes: "Went through the proposal and the three user roles. Scope is right for a diploma project; booking rules need to be written down clearly.",
          actionPlan: "1) Update the SRS and SDD. 2) Build the booking module prototype before the next consultation.",
        },
      },
    },
  });
  await prisma.appointment.create({
    data: {
      studentId: "BCS2403-001",
      lecturerId: "LEC001",
      slotId: rejectedSlot.id,
      purpose: "Ask about the internship placement letter",
      status: "REJECTED",
      remarks: "I am at a faculty meeting at this time. Please book a slot next week.",
    },
  });
  // Next week's Wednesday slot for Dr. Nurul Huda: approved, so the slot is BOOKED.
  const approvedSlot = await prisma.availabilitySlot.findFirstOrThrow({ where: { lecturerId: "LEC001", slotDate: weekdays[2] } });
  await prisma.$transaction([
    prisma.appointment.create({
      data: { studentId: "BCS2403-001", lecturerId: "LEC001", slotId: approvedSlot.id, purpose: "Review chapter 3 of the project report", status: "APPROVED" },
    }),
    prisma.availabilitySlot.update({ where: { id: approvedSlot.id }, data: { slotStatus: "BOOKED" } }),
  ]);

  // Module 4 testing for Dr. Nurul Huda: two PENDING requests next week (Kavitha Mon, Aina Thu) and an
  // APPROVED consultation two days ago that still needs notes.
  const book = async (studentId: string, slotDate: Date, purpose: string, status: "PENDING" | "APPROVED") => {
    const slot = await prisma.availabilitySlot.findFirstOrThrow({ where: { lecturerId: "LEC001", slotDate } });
    await prisma.$transaction([
      prisma.appointment.create({ data: { studentId, lecturerId: "LEC001", slotId: slot.id, purpose, status } }),
      prisma.availabilitySlot.update({ where: { id: slot.id }, data: { slotStatus: "BOOKED" } }),
    ]);
  };
  await book("BCS2402-015", weekdays[0], "Ask about changing my final year project title", "PENDING");
  await book("BCS2403-001", weekdays[3], "Get feedback on my system architecture diagram", "PENDING");
  const twoDaysAgo = new Date(todayInMalaysia().getTime() - 2 * dayMs);
  await prisma.availabilitySlot.create({
    data: { lecturerId: "LEC001", slotDate: twoDaysAgo, startTime: time("11:00"), endTime: time("11:30"), location: "Room B2.14" },
  });
  await book("BCS2402-015", twoDaysAgo, "Discuss my internship logbook", "APPROVED");

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  console.log(`\nSeeded slots for ${fmt(weekdays[0])} to ${fmt(weekdays[4])} (Mon-Fri, ${TIME_ZONE}).`);
  console.log(`Dr. Nurul Huda: PENDING ${fmt(weekdays[0])} (Kavitha) and ${fmt(weekdays[3])} (Aina); APPROVED ${fmt(twoDaysAgo)} awaiting notes (Kavitha).`);
  console.log(`Aina's sample appointments: COMPLETED ${fmt(lastWeekTue)}, REJECTED ${fmt(lastWeekThu)}, APPROVED ${fmt(weekdays[2])}.`);
  console.log(`\nSeed logins (password for all: ${DEMO_PASSWORD})`);
  console.table([
    { role: "ADMIN", email: "admin@scas.test", id: "ADM001" },
    ...lecturers.map((l) => ({ role: "LECTURER", email: l.email, id: l.lecturerId })),
    ...students.map((s) => ({ role: s.inactive ? "STUDENT (INACTIVE)" : "STUDENT", email: s.email, id: s.studentId, programme: programmeOf(s.studentId) })),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
