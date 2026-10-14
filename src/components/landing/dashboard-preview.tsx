"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

const slots = [
  { day: "Mon, 19 Oct", time: "10:00 - 10:30", where: "Room B2.14" },
  { day: "Tue, 20 Oct", time: "10:00 - 10:30", where: "Booked", booked: true },
  { day: "Thu, 22 Oct", time: "14:30 - 15:00", where: "Room B2.14" },
  { day: "Fri, 23 Oct", time: "10:00 - 10:30", where: "Room B2.14" },
];

/**
 * What is behind the door on the landing page: the real AppShell (light, as the app looks inside)
 * around a student dashboard with sample data. Illustration only: inert, hidden from screen readers.
 * Loaded only by the desktop scroll sequence, never on phones.
 */
export default function DashboardPreview({ className }: { className?: string }) {
  return (
    <div aria-hidden inert data-theme="light" className={cn("h-full w-full overflow-hidden bg-canvas text-ink", className)}>
      <AppShell role="STUDENT" user={{ name: "Aina Sofea binti Rahman" }} title="Dashboard">
        <div className="grid gap-6">
          <div>
            <p className="text-sm text-muted">Thursday, 15 October 2026</p>
            <p className="font-display text-title font-bold">Hi, Aina</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              ["Upcoming", 2],
              ["Pending", 1],
              ["Approved", 1],
              ["Completed", 4],
            ].map(([label, value]) => (
              <section key={label} className="rounded-card border border-line bg-surface p-4 shadow-card">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-1 font-display text-3xl font-bold">{value}</p>
              </section>
            ))}
          </div>
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
            <Card>
              <CardHeader title="Next appointment" action={<StatusBadge status="APPROVED" />} />
              <CardBody className="grid gap-1">
                <p className="text-lg font-semibold">Review chapter 3 of the project report</p>
                <p className="font-mono text-sm text-muted">APT-0012 Wed, 21 Oct, 14:30 - 15:00</p>
                <p className="text-sm text-muted">Dr. Nurul Huda binti Ismail, Room B2.14</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Open slots" description="Dr. Nurul Huda, next four weeks" />
              <CardBody>
                <ul className="grid grid-cols-2 gap-2">
                  {slots.map((s) => (
                    <li key={s.day} className={cn("rounded-control border border-line px-3 py-2.5", s.booked ? "bg-surface-2 text-muted" : "bg-surface")}>
                      <span className="block text-xs font-semibold text-muted">{s.day}</span>
                      <span className={cn("block font-mono text-sm font-semibold", s.booked && "line-through")}>{s.time}</span>
                      <span className="block truncate text-xs text-muted">{s.where}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
