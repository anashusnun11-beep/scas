import { ChalkboardTeacherIcon, CheckIcon, ShieldCheckIcon, StudentIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ReportChart } from "@/components/admin/report-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import type { ReportData } from "@/lib/reports";
import { Screen } from "./how-it-works";

/**
 * One cell per role (bento: student two columns + lecturer on top, admin across the full width
 * below, where the report chart has room). Every preview is built from the real SCAS components with sample data.
 */
export function RoleSections() {
  return (
    <section id="roles" aria-labelledby="roles-title" className="scroll-mt-24 px-4 py-28 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-6xl">
        <h2 id="roles-title" className="reveal max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
          One system, three doors.
        </h2>
        <p className="reveal mt-5 max-w-[56ch] text-lg leading-relaxed text-muted">
          Students, lecturers and the admin office each get their own view, with only the actions their role allows.
        </p>

        <div className="mt-14 grid grid-flow-dense gap-4 lg:grid-cols-3">
          <RoleCell
            icon={StudentIcon}
            title="Students"
            lead="Book office hours without waiting in the corridor."
            can={["See your lecturer's open slots", "Book and track every request", "Print the appointment slip", "Read past notes and remarks"]}
            className="lg:col-span-2"
            wide
          >
            <StudentPreview />
          </RoleCell>
          <RoleCell
            icon={ChalkboardTeacherIcon}
            title="Lecturers"
            lead="Office hours that run themselves."
            can={["Publish and edit slots", "Approve, reject or reschedule", "Set daily and weekly limits", "Record consultation notes"]}
          >
            <LecturerPreview />
          </RoleCell>
          <RoleCell
            icon={ShieldCheckIcon}
            title="Admin office"
            lead="Accounts and reports in one place."
            can={["Manage students and lecturers", "Assign each student a lecturer", "Generate and print reports"]}
            className="lg:col-span-3"
            side
          >
            <AdminPreview />
          </RoleCell>
        </div>
      </div>
    </section>
  );
}

function RoleCell({
  icon: IconComponent,
  title,
  lead,
  can,
  className,
  wide = false,
  side = false,
  children,
}: {
  icon: Icon;
  title: string;
  lead: string;
  can: string[];
  className?: string;
  wide?: boolean;
  /** Text on the left, preview on the right (the full-width admin cell). */
  side?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "reveal group grid grid-rows-[auto_1fr] gap-6 overflow-hidden rounded-card border border-line bg-surface p-5 sm:p-7",
        side && "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-1 lg:items-center lg:gap-10",
        "transition-[border-color] duration-200 hover:border-line-strong",
        className,
      )}
    >
      <div className={cn("grid gap-5", wide && "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start")}>
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-primary/15 text-primary">
              <IconComponent aria-hidden className="size-5" weight="bold" />
            </span>
            <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
          </div>
          <p className="mt-3 text-lg leading-snug">{lead}</p>
        </div>
        <ul className="grid gap-2 text-sm text-muted">
          {can.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
              {c}
            </li>
          ))}
        </ul>
      </div>
      {/* the preview rises slightly on hover: the cell is a window, the app is behind it */}
      <div className="grid transition-transform duration-500 ease-out-soft group-hover:-translate-y-1 motion-reduce:transform-none">{children}</div>
    </article>
  );
}

function StudentPreview() {
  const counters = [
    { label: "Upcoming", value: 2 },
    { label: "Pending", value: 1 },
    { label: "Approved", value: 1 },
    { label: "Completed", value: 4 },
  ];
  return (
    <Screen>
      <p className="text-xs text-muted">Thursday, 15 October 2026</p>
      <p className="font-display text-2xl font-bold">Hi, Aina</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counters.map((c) => (
          <div key={c.label} className="rounded-control border border-line bg-surface p-3">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 rounded-control border border-line bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">Next appointment</p>
          <p className="truncate font-semibold">Review chapter 3 of the project report</p>
          <p className="truncate font-mono text-xs text-muted">Wed, 21 Oct, 14:30 - 15:00, Room B2.14</p>
        </div>
        <StatusBadge status="APPROVED" className="justify-self-start" />
      </div>
      <div className="mt-3 grid gap-3 rounded-control border border-line bg-surface p-4">
        <p className="text-xs font-semibold text-muted">Open slots, Dr. Nurul Huda</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Mon, 19 Oct", "10:00 - 10:30"],
            ["Tue, 20 Oct", "10:00 - 10:30", true],
            ["Thu, 22 Oct", "14:30 - 15:00"],
            ["Fri, 23 Oct", "10:00 - 10:30"],
          ].map(([day, time, booked]) => (
            <li key={String(day)} className={cn("rounded-control border border-line px-3 py-2", booked ? "bg-surface-2 text-muted" : "bg-canvas")}>
              <span className="block text-xs text-muted">{day}</span>
              <span className={cn("block font-mono text-sm font-semibold", booked && "line-through")}>{time}</span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

function LecturerPreview() {
  const rows = [
    { name: "Kavitha a/p Raman", purpose: "Change my project title", when: "Mon, 19 Oct, 10:00" },
    { name: "Lim Wei Jie", purpose: "Taxation quiz feedback", when: "Tue, 20 Oct, 14:00" },
  ];
  return (
    <Screen>
      <p className="text-sm font-semibold">Booking requests</p>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="grid gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold">{r.name}</p>
              <StatusBadge status="PENDING" />
            </div>
            <p className="truncate text-xs text-muted">
              {r.purpose}, <span className="font-mono">{r.when}</span>
            </p>
            <div className="flex gap-2">
              <span className="inline-flex h-8 items-center rounded-control bg-primary px-3 text-xs font-semibold text-on-primary">Approve</span>
              <span className="inline-flex h-8 items-center rounded-control border border-line bg-surface px-3 text-xs font-semibold">Reject</span>
            </div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

/** The real report chart (module 6) with sample figures. */
const sampleReport: ReportData = {
  total: 24,
  counts: { PENDING: 2, RESCHEDULED: 1, APPROVED: 2, COMPLETED: 10, REJECTED: 5, CANCELLED: 4 },
  lecturers: [
    { lecturerId: "LEC001", name: "Dr. Nurul Huda", inactive: false, total: 14, counts: { PENDING: 2, RESCHEDULED: 1, APPROVED: 2, COMPLETED: 4, REJECTED: 3, CANCELLED: 2 } },
    { lecturerId: "LEC002", name: "En. Hafiz", inactive: false, total: 10, counts: { PENDING: 0, RESCHEDULED: 0, APPROVED: 0, COMPLETED: 6, REJECTED: 2, CANCELLED: 2 } },
  ],
};

function AdminPreview() {
  return (
    <Screen>
      <p className="mb-4 text-sm font-semibold">Appointments by lecturer</p>
      <ReportChart type="BY_LECTURER" data={sampleReport} />
    </Screen>
  );
}
