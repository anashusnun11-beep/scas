import { ArrowRightIcon, CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentRows } from "@/components/lecturer/appointment-rows";
import { toAppointmentItem } from "@/components/lecturer/items";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLongDate, malaysiaToday } from "@/lib/dates";
import { requireLecturer } from "@/server/lecturer-context";
import { getLecturerDashboard } from "@/server/queries/lecturer";

export const metadata: Metadata = { title: "Lecturer dashboard | SCAS" };

/** Lecturer home: what needs attention now (UI6 counters) and today's consultations. */
export default async function LecturerDashboard() {
  const { user, lecturerId } = await requireLecturer();
  const data = await getLecturerDashboard(lecturerId);
  const now = new Date();

  const counters = [
    { label: "Pending requests", value: data.pending, href: "/lecturer/requests" },
    { label: "Today's consultations", value: data.today.length, href: "/lecturer/appointments" },
    { label: "Need notes", value: data.needsNotes, href: "/lecturer/appointments" },
    { label: "Open slots this week", value: data.openThisWeek, href: "/lecturer/slots" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted">{formatLongDate(malaysiaToday())}</p>
        <h2 className="font-display text-title font-bold">Hi, {user.name.replace(/^(Dr\.|En\.|Pn\.|Prof\.)\s+/, "").split(" ")[0]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counters.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-card border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-line-strong"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 flex items-center justify-between">
              <AnimatedNumber value={c.value} className="font-display text-3xl font-bold" />
              <ArrowRightIcon aria-hidden className="size-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Today"
          description="Approved and completed consultations for today."
          action={
            data.pending > 0 && (
              <Link href="/lecturer/requests" className={buttonClasses({ size: "sm" })}>
                Review {data.pending} request{data.pending === 1 ? "" : "s"}
              </Link>
            )
          }
        />
        {data.today.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={CalendarCheckIcon} title="No consultations today">
              Approved appointments for today show up here.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-3 border-t border-line">
            <AppointmentRows items={data.today.map((r) => toAppointmentItem(r, now))} />
          </div>
        )}
      </Card>
    </div>
  );
}
