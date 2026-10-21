import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { LecturerDirectory } from "@/components/student/lecturer-directory";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentCode } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { formatLongDate, formatSlotDate, formatTimeRange, malaysiaToday } from "@/lib/dates";
import { getDashboardStats, getLecturerDirectory, getMyAppointments } from "@/server/queries/student";

export const metadata: Metadata = { title: "Student dashboard | SCAS" };

/** UI2: counters, the next appointment, and the lecturers a student can book (FR03, FR04). */
export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const [lecturers, stats, upcoming] = await Promise.all([
    getLecturerDirectory(),
    getDashboardStats(user.id),
    getMyAppointments(user.id, "upcoming"),
  ]);
  // Lecturers with open slots first, so the dashboard shows who can actually be booked.
  const bookableFirst = [...lecturers].sort((a, b) => Number(b.openSlots > 0) - Number(a.openSlots > 0));
  const next = upcoming.find((a) => a.status === "APPROVED" || a.status === "RESCHEDULED" || a.status === "PENDING");

  const counters = [
    { label: "Upcoming", value: stats.upcoming },
    { label: "Pending", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <p className="text-sm text-muted">{formatLongDate(malaysiaToday())}</p>
        <h2 className="font-display text-title font-bold">Hi, {user.name.split(" ")[0]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counters.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-sm text-muted">{c.label}</p>
            <AnimatedNumber value={c.value} className="mt-1 block font-display text-3xl font-bold" />
          </Card>
        ))}
      </div>

      {next && (
        <Link
          href={`/student/appointments/${next.id}`}
          className="group flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-line-strong"
        >
          <div className="min-w-0">
            <p className="text-sm text-muted">Next appointment</p>
            <p className="font-display text-subheading font-semibold">
              {formatSlotDate(next.slot.slotDate)}, <span className="font-mono">{formatTimeRange(next.slot.startTime, next.slot.endTime)}</span>
            </p>
            <p className="truncate text-sm text-muted">
              {appointmentCode(next.id)} {next.purpose}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={next.status} />
            <ArrowRightIcon aria-hidden className="size-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </Link>
      )}

      <Card>
        <CardHeader
          title="Book a consultation"
          description="Choose any lecturer to see their open slots."
          action={
            lecturers.length > 4 && (
              <Link href="/student/lecturers" className="text-sm font-semibold text-accent-ink hover:underline">
                See all
              </Link>
            )
          }
        />
        <CardBody>
          <LecturerDirectory lecturers={bookableFirst} limit={4} />
        </CardBody>
      </Card>
    </div>
  );
}
