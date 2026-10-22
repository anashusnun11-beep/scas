// Extra demo data: 8 more lecturers with weekly consultation slots for the next 3 weeks, future slots for the
// two original lecturers, and 10 more students, so students have real choices (decision 2026-10-21).
// ADDITIVE and safe to re-run: never deletes or changes existing rows. Lecturers and students whose ID or e-mail
// already exists are skipped; a slot is skipped when it would overlap one of that lecturer's existing slots.
// Run with `npm run db:seed-extra` (uses DATABASE_URL from .env). Demo password: Scas@1234.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseStudentId } from "../src/lib/student-id";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PASSWORD = "Scas@1234";
const TIME_ZONE = "Asia/Kuala_Lumpur";
const WEEKS = 3;
const SESSION_MINUTES = 30; // the default session_duration, so every slot fits the lecturer's limits

/** Today's calendar date in Malaysia, as a UTC-midnight Date (how Prisma stores @db.Date). */
function todayInMalaysia(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}

/** Weekdays (Mon-Fri) from tomorrow for the next WEEKS weeks, with 0 = Monday. */
function upcomingWeekdays(): { date: Date; weekday: number }[] {
  const today = todayInMalaysia();
  const days: { date: Date; weekday: number }[] = [];
  for (let i = 1; i <= WEEKS * 7; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + i);
    const weekday = (date.getUTCDay() + 6) % 7;
    if (weekday < 5) days.push({ date, weekday });
  }
  return days;
}

/** A wall-clock time for a @db.Time column. */
function time(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00Z`);
}

function plusMinutes(t: Date, minutes: number) {
  return new Date(t.getTime() + minutes * 60_000);
}

type SlotPattern = { location: string; days: number[]; times: string[] };

const NEW_LECTURERS: (SlotPattern & {
  lecturerId: string;
  name: string;
  email: string;
  phoneNo: string;
  department: string;
  officeRoom: string;
  position: string;
})[] = [
  { lecturerId: "LEC003", name: "Dr. Ahmad Faizal bin Kamarudin", email: "faizal@scas.test", phoneNo: "03-8925 1208", department: "Computer Science", officeRoom: "Block B, Level 2, Room 2.08", position: "Senior Lecturer", location: "Room B2.08", days: [0, 1, 3], times: ["09:00", "09:30"] },
  { lecturerId: "LEC004", name: "Pn. Siti Nur Aisyah binti Abdullah", email: "aisyah@scas.test", phoneNo: "03-8925 1220", department: "Computer Science", officeRoom: "Block B, Level 2, Room 2.20", position: "Lecturer", location: "Room B2.20", days: [1, 2, 4], times: ["11:00", "11:30"] },
  { lecturerId: "LEC005", name: "En. Mohd Hairul Nizam bin Ismail", email: "hairul@scas.test", phoneNo: "03-8925 1312", department: "Accounting", officeRoom: "Block B, Level 3, Room 3.12", position: "Lecturer", location: "Room B3.12", days: [0, 2], times: ["15:00", "15:30", "16:00"] },
  { lecturerId: "LEC006", name: "Dr. Lee Mei Ling", email: "meiling@scas.test", phoneNo: "03-8925 1301", department: "Accounting", officeRoom: "Block B, Level 3, Room 3.01", position: "Senior Lecturer", location: "Room B3.01", days: [1, 3, 4], times: ["10:00", "10:30"] },
  { lecturerId: "LEC007", name: "Pn. Rohana binti Mat Saad", email: "rohana@scas.test", phoneNo: "03-8925 1107", department: "Business Studies", officeRoom: "Block C, Level 1, Room 1.07", position: "Lecturer", location: "Room C1.07", days: [0, 1, 2, 3], times: ["14:30"] },
  { lecturerId: "LEC008", name: "En. Rajesh a/l Subramaniam", email: "rajesh@scas.test", phoneNo: "03-8925 1115", department: "Business Studies", officeRoom: "Block C, Level 1, Room 1.15", position: "Senior Lecturer", location: "Room C1.15", days: [2, 4], times: ["09:00", "09:30", "10:00"] },
  { lecturerId: "LEC009", name: "En. Zulkarnain bin Yusof", email: "zulkarnain@scas.test", phoneNo: "03-8925 1004", department: "Landscaping", officeRoom: "Block D, Ground Floor, Room G.04", position: "Lecturer", location: "Room DG.04", days: [1, 3], times: ["08:30", "09:00"] },
  { lecturerId: "LEC010", name: "Dr. Farah Hanim binti Osman", email: "farahhanim@scas.test", phoneNo: "03-8925 1210", department: "Finance (CFAB)", officeRoom: "Block C, Level 2, Room 2.10", position: "Senior Lecturer", location: "Room C2.10", days: [0, 3], times: ["11:00", "11:30", "12:00"] },
];

/** More future slots for the two original seed lecturers (their seeded week may be over). */
const EXISTING_LECTURER_SLOTS: Record<string, SlotPattern> = {
  LEC001: { location: "Room B2.14", days: [0, 2, 4], times: ["10:00", "11:00"] },
  LEC002: { location: "Room B3.05", days: [1, 3], times: ["14:00", "15:00"] },
};

const NEW_STUDENTS = [
  { studentId: "BCS2404-021", name: "Nur Aqilah binti Rosli", email: "aqilah@scas.test", semester: 3 },
  { studentId: "BCS2404-034", name: "Muhammad Haziq bin Azman", email: "haziq@scas.test", semester: 3 },
  { studentId: "BCS2501-007", name: "Tan Wei Ming", email: "weiming@scas.test", semester: 1 },
  { studentId: "BDA2403-012", name: "Siti Khadijah binti Hamzah", email: "khadijah@scas.test", semester: 4 },
  { studentId: "BDA2502-018", name: "Arvind a/l Muthu", email: "arvind@scas.test", semester: 2 },
  { studentId: "BDB2402-025", name: "Nurul Izzati binti Kamal", email: "izzati@scas.test", semester: 5 },
  { studentId: "BDB2501-009", name: "Amirul Hakim bin Zainal", email: "amirul@scas.test", semester: 1 },
  { studentId: "BLH2403-004", name: "Mohd Danial bin Fauzi", email: "danial@scas.test", semester: 4 },
  { studentId: "CFAB2501-011", name: "Chong Jia Hui", email: "jiahui@scas.test", semester: 1 },
  { studentId: "CFAB2402-006", name: "Puteri Balqis binti Megat", email: "balqis@scas.test", semester: 3 },
];

/** Creates the pattern's slots for one lecturer, skipping any that overlap an existing slot. Returns how many. */
async function addSlots(lecturerId: string, pattern: SlotPattern) {
  const days = upcomingWeekdays().filter((d) => pattern.days.includes(d.weekday));
  const existing = await prisma.availabilitySlot.findMany({
    where: { lecturerId, slotDate: { in: days.map((d) => d.date) } },
    select: { slotDate: true, startTime: true, endTime: true },
  });
  const rows = days.flatMap(({ date }) =>
    pattern.times
      .map((t) => ({ slotDate: date, startTime: time(t), endTime: plusMinutes(time(t), SESSION_MINUTES), location: pattern.location, lecturerId }))
      .filter((s) => !existing.some((e) => e.slotDate.getTime() === s.slotDate.getTime() && s.startTime < e.endTime && e.startTime < s.endTime)),
  );
  if (rows.length) await prisma.availabilitySlot.createMany({ data: rows });
  return rows.length;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const report: string[] = [];

  for (const l of NEW_LECTURERS) {
    const taken = await prisma.user.findUnique({ where: { email: l.email }, select: { id: true } });
    const idTaken = await prisma.lecturer.findUnique({ where: { lecturerId: l.lecturerId }, select: { lecturerId: true } });
    if (taken || idTaken) {
      report.push(`skip lecturer ${l.lecturerId} (already exists)`);
    } else {
      await prisma.lecturer.create({
        data: {
          lecturerId: l.lecturerId,
          department: l.department,
          officeRoom: l.officeRoom,
          position: l.position,
          // Schema defaults: 6/day, 20/week, 2/student/week, 30 min, 24 h notice, enabled.
          limit: { create: {} },
          user: { create: { name: l.name, email: l.email, phoneNo: l.phoneNo, passwordHash, role: "LECTURER" } },
        },
      });
      report.push(`lecturer ${l.lecturerId} ${l.name}`);
    }
    // Slots only for a lecturer that exists under this ID (skipped e-mail clashes leave no record to attach to).
    if (await prisma.lecturer.findUnique({ where: { lecturerId: l.lecturerId }, select: { lecturerId: true } })) {
      report.push(`  + ${await addSlots(l.lecturerId, l)} slots for ${l.lecturerId}`);
    }
  }

  for (const [lecturerId, pattern] of Object.entries(EXISTING_LECTURER_SLOTS)) {
    if (await prisma.lecturer.findUnique({ where: { lecturerId }, select: { lecturerId: true } })) {
      report.push(`  + ${await addSlots(lecturerId, pattern)} slots for ${lecturerId}`);
    }
  }

  for (const s of NEW_STUDENTS) {
    const parsed = parseStudentId(s.studentId);
    if (!parsed) throw new Error(`Student ID ${s.studentId} does not match the KPMB format`);
    const exists =
      (await prisma.user.findUnique({ where: { email: s.email }, select: { id: true } })) ??
      (await prisma.student.findUnique({ where: { studentId: parsed.id }, select: { studentId: true } }));
    if (exists) {
      report.push(`skip student ${parsed.id} (already exists)`);
      continue;
    }
    await prisma.student.create({
      data: {
        studentId: parsed.id,
        programme: parsed.programme,
        semester: s.semester,
        user: { create: { name: s.name, email: s.email, passwordHash, role: "STUDENT" } },
      },
    });
    report.push(`student ${parsed.id} ${s.name}`);
  }

  console.log(report.join("\n"));
  console.log(`\nDone. Every new account uses the password ${DEMO_PASSWORD}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
