// Development seed: 1 admin, 2 lecturers (with consultation limits and slots next week), 3 students.
// WARNING: this wipes every SCAS table first. Only run it against a development database.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
      department: "Information Systems",
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

  const students = [
    { studentId: "2023110987", name: "Aina Sofea binti Rahman", email: "aina@scas.test", programme: "Diploma in Computer Science", lecturerId: "LEC001" },
    { studentId: "2022098812", name: "Kavitha a/p Raman", email: "kavitha@scas.test", programme: "Diploma in Computer Science", lecturerId: "LEC001" },
    { studentId: "2023104421", name: "Lim Wei Jie", email: "weijie@scas.test", programme: "Diploma in Information Systems", lecturerId: "LEC002" },
  ];

  for (const s of students) {
    await prisma.student.create({
      data: {
        studentId: s.studentId,
        programme: s.programme,
        faculty: "Faculty of Computing",
        semester: 4,
        lecturer: { connect: { lecturerId: s.lecturerId } },
        user: {
          create: {
            name: s.name,
            email: s.email,
            passwordHash,
            role: "STUDENT",
          },
        },
      },
    });
  }

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  console.log(`\nSeeded slots for ${fmt(weekdays[0])} to ${fmt(weekdays[4])} (Mon-Fri, ${TIME_ZONE}).`);
  console.log(`\nSeed logins (password for all: ${DEMO_PASSWORD})`);
  console.table([
    { role: "ADMIN", email: "admin@scas.test", id: "ADM001" },
    ...lecturers.map((l) => ({ role: "LECTURER", email: l.email, id: l.lecturerId })),
    ...students.map((s) => ({ role: "STUDENT", email: s.email, id: s.studentId })),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
