import { ArrowRightIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { requireRole } from "@/lib/auth/guard";
import { formatLongDate, formatSlotDate, malaysiaToday } from "@/lib/dates";
import { getAdminDashboard } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Admin dashboard | SCAS" };

/** Admin home: the numbers that matter at a glance, and the two main jobs one click away. */
export default async function AdminDashboard() {
  const user = await requireRole("ADMIN");
  const data = await getAdminDashboard();

  const counters = [
    { label: "Active students", value: data.students, href: "/admin/students" },
    { label: "Active lecturers", value: data.lecturers, href: "/admin/lecturers" },
    { label: "Appointments this week", value: data.thisWeek, href: "/admin/reports" },
    { label: "Pending requests", value: data.pending, href: "/admin/reports" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted">{formatLongDate(malaysiaToday())}</p>
        <h2 className="font-display text-title font-bold">Hi, {user.name.split(" ")[0]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counters.map((c) => (
          <Link key={c.label} href={c.href} className="group rounded-card border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-line-strong">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 flex items-center justify-between">
              <AnimatedNumber value={c.value} className="font-display text-3xl font-bold" />
              <ArrowRightIcon aria-hidden className="size-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>
      <p className="-mt-3 text-xs text-muted">This week = week of {formatSlotDate(data.weekStart)}, by consultation date, not counting rejected or cancelled ones.</p>

      {data.unassigned > 0 && (
        <FormMessage tone="info">
          {data.unassigned} active student{data.unassigned === 1 ? " has" : "s have"} no assigned lecturer yet and can&apos;t book.{" "}
          <Link href="/admin/students" className="font-semibold underline underline-offset-2">
            Assign them
          </Link>
        </FormMessage>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Students" description="Add students, assign their lecturer, deactivate accounts." />
          <CardBody className="flex flex-wrap gap-3">
            <Link href="/admin/students/new" className={buttonClasses()}>
              <UserPlusIcon aria-hidden className="size-4" />
              Add student
            </Link>
            <Link href="/admin/students" className={buttonClasses({ variant: "secondary" })}>
              Manage students
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Lecturers" description="Add lecturers, update their office and contact details." />
          <CardBody className="flex flex-wrap gap-3">
            <Link href="/admin/lecturers/new" className={buttonClasses()}>
              <UserPlusIcon aria-hidden className="size-4" />
              Add lecturer
            </Link>
            <Link href="/admin/lecturers" className={buttonClasses({ variant: "secondary" })}>
              Manage lecturers
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
