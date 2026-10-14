import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { appointmentCode, remarksLabel } from "@/lib/appointment";
import { formatLongDate, formatSlotDate, formatTimeRange, formatTimestamp, slotStartsAt } from "@/lib/dates";
import { requireLecturer } from "@/server/lecturer-context";
import { getLecturerAppointment, getRescheduleOptions } from "@/server/queries/lecturer";
import { AppointmentControls } from "./appointment-controls";
import { lecturerAppointmentPath, toSlotChoices } from "./items";
import { NotesForm } from "./notes-form";

const BACK = {
  requests: { href: "/lecturer/requests", label: "Booking requests" },
  appointments: { href: "/lecturer/appointments", label: "Appointments" },
  history: { href: "/lecturer/history", label: "Appointment history" },
} as const;

/**
 * One appointment for the lecturer: student, slot, purpose, status actions (FR10, FR11) and notes (FR12).
 * Rendered by /lecturer/requests/[id], /appointments/[id] and /history/[id]; if the status belongs to
 * another page, redirect there (keeps the sidebar right). Other lecturers' appointments are 404 (NFR03).
 */
export async function LecturerAppointmentView({ id, section }: { id: string; section: keyof typeof BACK }) {
  const { lecturerId } = await requireLecturer();
  const a = await getLecturerAppointment(lecturerId, Number(id));
  if (!a) notFound();

  const home = lecturerAppointmentPath(a.status, a.id);
  if (!home.startsWith(`/lecturer/${section}/`)) redirect(home);

  const active = a.status === "PENDING" || a.status === "APPROVED" || a.status === "RESCHEDULED";
  const slotChoices = active ? toSlotChoices(await getRescheduleOptions(lecturerId)) : [];
  const startsAt = slotStartsAt(a.slot.slotDate, a.slot.startTime);
  const started = startsAt <= new Date();
  const current = `${formatSlotDate(a.slot.slotDate)}, ${formatTimeRange(a.slot.startTime, a.slot.endTime)}`;

  const facts: [string, ReactNode][] = [
    ["Student", a.student.user.name],
    ["Student ID", <span key="id" className="font-mono">{a.student.studentId}</span>],
    ["Programme", a.student.programme ?? "Not set"],
    ["E-mail", <a key="mail" href={`mailto:${a.student.user.email}`} className="text-accent-ink hover:underline">{a.student.user.email}</a>],
    ["Phone", a.student.user.phoneNo ? <span key="tel" className="font-mono">{a.student.user.phoneNo}</span> : "Not set"],
    ["Date", formatLongDate(a.slot.slotDate)],
    ["Time", <span key="time" className="font-mono">{formatTimeRange(a.slot.startTime, a.slot.endTime)}</span>],
    ["Venue", a.slot.location],
    ["Purpose", a.purpose],
    ["Requested", formatTimestamp(a.createdAt)],
  ];

  return (
    <div className="grid gap-6">
      <Link href={BACK[section].href} className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        {BACK[section].label}
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={appointmentCode(a.id)} description={a.student.user.name} />
          <CardBody className="pt-2">
            <dl className="divide-y divide-line">
              {facts.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="min-w-0 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Status" />
            <CardBody className="pt-3">
              <AppointmentControls
                // Remount when the appointment changes (e.g. after a reschedule refresh) so local state starts fresh.
                key={`${a.status}-${a.updatedAt.getTime()}`}
                id={a.id}
                code={appointmentCode(a.id)}
                status={a.status}
                started={started}
                current={current}
                studentName={a.student.user.name}
                slotChoices={slotChoices}
              />
            </CardBody>
          </Card>
          {a.remarks && (
            <Card>
              <CardHeader title={remarksLabel(a.status)} />
              <CardBody className="pt-3">
                <p className="leading-relaxed">{a.remarks}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {(a.status === "APPROVED" || a.status === "RESCHEDULED") && (
        <Card>
          <CardHeader title="Record consultation notes" description="Saving the notes marks the appointment COMPLETED." />
          <CardBody>
            {started ? (
              <NotesForm appointmentId={a.id} />
            ) : (
              <p className="text-sm text-muted">You can record notes once the consultation starts ({current}).</p>
            )}
          </CardBody>
        </Card>
      )}

      {a.status === "COMPLETED" && a.note && (
        <Card>
          <CardHeader title="Consultation notes" description={`Recorded ${formatTimestamp(a.note.recordedAt)}. You can still edit them.`} />
          <CardBody>
            <NotesForm appointmentId={a.id} defaultNotes={a.note.notes} defaultActionPlan={a.note.actionPlan ?? ""} editing />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
