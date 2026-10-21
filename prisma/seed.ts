// Development seed: 1 admin, 2 lecturers (with consultation limits and slots next week), 4 students, sample
// appointments for every module, and report demo data spread over last month and this month (module 6).
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

  // KPMB student ID: <CODE> + 7 digits, stored as e.g. BCS2403-001; programme comes from the code (src/lib/student-id.ts).
  // No assigned lecturer: students may book any active lecturer (decision 2026-10-21).
  const students = [
    { studentId: "BCS2403-001", name: "Aina Sofea binti Rahman", email: "aina@scas.test" },
    { studentId: "BCS2402-015", name: "Kavitha a/p Raman", email: "kavitha@scas.test" },
    { studentId: "BDA2401-007", name: "Lim Wei Jie", email: "weijie@scas.test" },
    // Deactivated account, to test that INACTIVE users cannot log in (BR8, module 2).
    { studentId: "BDB2401-031", name: "Nur Iman binti Zulkifli", email: "iman@scas.test", inactive: true },
  ];

  for (const s of students) {
    await prisma.student.create({
      data: {
        studentId: s.studentId,
        programme: programmeOf(s.studentId),
        semester: 4,
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

  const demo = await seedReportDemo(weekdays);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  console.log(`\nSeeded slots for ${fmt(weekdays[0])} to ${fmt(weekdays[4])} (Mon-Fri, ${TIME_ZONE}).`);
  console.log(`Dr. Nurul Huda: PENDING ${fmt(weekdays[0])} (Kavitha) and ${fmt(weekdays[3])} (Aina); APPROVED ${fmt(twoDaysAgo)} awaiting notes (Kavitha).`);
  console.log(`Aina's sample appointments: COMPLETED ${fmt(lastWeekTue)}, REJECTED ${fmt(lastWeekThu)}, APPROVED ${fmt(weekdays[2])}.`);
  console.log(`Report demo: ${demo.past} finished appointments from ${fmt(demo.from)} to ${fmt(demo.to)}, RESCHEDULED ${fmt(demo.rescheduled)} (Kavitha).`);
  console.log(`\nSeed logins (password for all: ${DEMO_PASSWORD})`);
  console.table([
    { role: "ADMIN", email: "admin@scas.test", id: "ADM001" },
    ...lecturers.map((l) => ({ role: "LECTURER", email: l.email, id: l.lecturerId })),
    ...students.map((s) => ({ role: s.inactive ? "STUDENT (INACTIVE)" : "STUDENT", email: s.email, id: s.studentId, programme: programmeOf(s.studentId) })),
  ]);
}

type DemoStatus = "COMPLETED" | "REJECTED" | "CANCELLED";
type DemoAppointment = { studentId: string; status: DemoStatus; purpose: string; remarks?: string };

/**
 * Module 6 demo data, so reports and charts look full: finished appointments for both lecturers spread
 * over last month and this month (weekdays from the 1st of last month up to last Sunday), plus one
 * RESCHEDULED consultation the week after next.
 * Chosen so the earlier modules' checks still hold: no new PENDING / APPROVED (pending and "need notes"
 * counts unchanged), no new COMPLETED for Aina, nothing active for En. Hafiz (he can still be
 * deactivated once his students move), nothing in the current week or next week (booking limits).
 */
async function seedReportDemo(nextWeek: Date[]) {
  const dayMs = 24 * 60 * 60 * 1000;
  const today = todayInMalaysia();
  const thisMonday = new Date(nextWeek[0].getTime() - 7 * dayMs);
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const days: Date[] = [];
  for (let d = from; d < thisMonday; d = new Date(d.getTime() + dayMs)) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d);
  }

  const plan: Record<"LEC001" | "LEC002", { location: string; times: string[]; items: DemoAppointment[] }> = {
    LEC001: {
      location: "Room B2.14",
      times: ["09:00", "14:30", "15:30"],
      items: [
        { studentId: "BCS2402-015", status: "COMPLETED", purpose: "Clarify the database normalisation assignment" },
        { studentId: "BCS2403-001", status: "REJECTED", purpose: "Ask about extending the mobile app assignment", remarks: "Extension requests go through the programme coordinator first." },
        { studentId: "BCS2402-015", status: "COMPLETED", purpose: "Plan my final year project timeline" },
        { studentId: "BCS2403-001", status: "CANCELLED", purpose: "Discuss the group project peer review", remarks: "I have been called to an urgent meeting. Please book another slot." },
        { studentId: "BCS2402-015", status: "CANCELLED", purpose: "Go through my internship placement options", remarks: "This clashes with the faculty board meeting. Please rebook." },
        { studentId: "BCS2402-015", status: "COMPLETED", purpose: "Review my ERD before submission" },
        { studentId: "BCS2402-015", status: "REJECTED", purpose: "Ask for a reference letter", remarks: "Reference letters are handled by the academic office. Please e-mail them." },
      ],
    },
    LEC002: {
      location: "Room B3.05",
      times: ["09:30", "11:00", "15:00"],
      items: [
        { studentId: "BDA2401-007", status: "COMPLETED", purpose: "Go through the cost accounting tutorial answers" },
        { studentId: "BDB2401-031", status: "COMPLETED", purpose: "Discuss my marketing assignment feedback" },
        { studentId: "BDA2401-007", status: "REJECTED", purpose: "Ask about retaking the taxation quiz", remarks: "Quiz retakes are not allowed under the course rules." },
        { studentId: "BDA2401-007", status: "COMPLETED", purpose: "Prepare for the financial accounting test" },
        { studentId: "BDB2401-031", status: "CANCELLED", purpose: "Ask about switching tutorial groups", remarks: "Tutorial group changes are now handled by the academic office." },
        { studentId: "BDA2401-007", status: "COMPLETED", purpose: "Check my audit case study draft" },
        { studentId: "BDB2401-031", status: "REJECTED", purpose: "Request a deadline extension", remarks: "Please submit your medical certificate to the programme coordinator." },
        { studentId: "BDA2401-007", status: "CANCELLED", purpose: "Discuss the accounting software lab", remarks: "The lab is closed for maintenance that day. Please rebook." },
        { studentId: "BDB2401-031", status: "COMPLETED", purpose: "Plan my semester study schedule" },
        { studentId: "BDA2401-007", status: "COMPLETED", purpose: "Review my budgeting project spreadsheet" },
      ],
    },
  };

  let past = 0;
  for (const [lecturerId, { location, times, items }] of Object.entries(plan)) {
    for (const [i, item] of items.entries()) {
      // Spread evenly over the weekdays; a different time per row keeps one lecturer's slots from overlapping.
      const slotDate = days[Math.floor(((i + 0.5) * days.length) / items.length)];
      const start = times[i % times.length];
      const [h, m] = start.split(":").map(Number);
      const end = `${String(h + Math.floor((m + 30) / 60)).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`;
      const startsAt = new Date(slotDate.getTime() + (h - 8) * 60 * 60 * 1000 + m * 60 * 1000); // MYT wall clock -> UTC
      const slot = await prisma.availabilitySlot.create({
        data: {
          lecturerId,
          slotDate,
          startTime: time(start),
          endTime: time(end),
          location,
          // Rejected and cancelled bookings freed their slot.
          slotStatus: item.status === "COMPLETED" ? "BOOKED" : "AVAILABLE",
        },
      });
      await prisma.appointment.create({
        data: {
          studentId: item.studentId,
          lecturerId,
          slotId: slot.id,
          purpose: item.purpose,
          status: item.status,
          remarks: item.remarks,
          createdAt: new Date(startsAt.getTime() - 3 * dayMs),
          updatedAt: item.status === "COMPLETED" ? new Date(startsAt.getTime() + 40 * 60 * 1000) : new Date(startsAt.getTime() - 2 * dayMs),
          note:
            item.status === "COMPLETED"
              ? {
                  create: {
                    notes: `${item.purpose}: went through it together. The student understands what to do next.`,
                    actionPlan: "Follow up by e-mail if anything is still unclear.",
                    recordedAt: new Date(startsAt.getTime() + 40 * 60 * 1000),
                  },
                }
              : undefined,
        },
      });
      past++;
    }
  }

  // Kavitha, the week after next: moved by Dr. Nurul Huda (RESCHEDULED counts as confirmed).
  const rescheduled = new Date(nextWeek[1].getTime() + 7 * dayMs);
  const slot = await prisma.availabilitySlot.create({
    data: { lecturerId: "LEC001", slotDate: rescheduled, startTime: time("10:00"), endTime: time("10:30"), location: "Room B2.14", slotStatus: "BOOKED" },
  });
  await prisma.appointment.create({
    data: {
      studentId: "BCS2402-015",
      lecturerId: "LEC001",
      slotId: slot.id,
      purpose: "Discuss my final year project literature review",
      status: "RESCHEDULED",
      remarks: "I am invigilating an exam at the original time, so I moved you to the following week.",
    },
  });

  return { past, from: days[0], to: days[days.length - 1], rescheduled };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
