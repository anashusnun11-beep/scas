import { ArrowLeftIcon, NotebookIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { appointmentCode, canPrintSlip, remarksLabel } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { formatTimestamp, malaysiaToday } from "@/lib/dates";
import { getAppointmentDetail } from "@/server/queries/student";
import { AppointmentFacts } from "./appointment-facts";

/** Upcoming appointments live under /student/appointments, past ones under /student/history (so the sidebar highlights the right item). */
export function studentAppointmentPath(slotDate: Date, id: number) {
  return slotDate < malaysiaToday() ? `/student/history/${id}` : `/student/appointments/${id}`;
}

/**
 * FR06 / FR08 record view: details, remarks, consultation notes (only for this student, NFR03), slip (FR07).
 * Rendered by both routes; if the date doesn't match the route, redirect to the other one.
 */
export async function StudentAppointmentView({ id, scope, booked }: { id: string; scope: "upcoming" | "past"; booked?: boolean }) {
  const user = await requireRole("STUDENT");
  const appointment = await getAppointmentDetail(user.id, Number(id));
  // Someone else's appointment looks exactly like one that doesn't exist.
  if (!appointment) notFound();

  const isPast = appointment.slot.slotDate < malaysiaToday();
  if (isPast !== (scope === "past")) redirect(studentAppointmentPath(appointment.slot.slotDate, appointment.id));
  const back = isPast ? { href: "/student/history", label: "Appointment history" } : { href: "/student/appointments", label: "Appointment status" };

  return (
    <div className="grid gap-6">
      <Link href={back.href} className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        {back.label}
      </Link>

      {booked && (
        <FormMessage tone="success">Booking submitted. It is PENDING until your lecturer approves it.</FormMessage>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={appointmentCode(appointment.id)} description={`Booked ${formatTimestamp(appointment.createdAt)}`} />
          <CardBody className="pt-2">
            <AppointmentFacts appointment={appointment} />
          </CardBody>
        </Card>

        <div className="grid gap-6">
          {appointment.remarks && (
            <Card>
              <CardHeader title={remarksLabel(appointment.status)} />
              <CardBody className="pt-3">
                <p className="leading-relaxed">{appointment.remarks}</p>
              </CardBody>
            </Card>
          )}

          {/* Slip card only while the appointment is still ahead: PENDING waits, APPROVED/RESCHEDULED print. */}
          {(canPrintSlip(appointment.status) || appointment.status === "PENDING") && (
            <Card>
              <CardHeader title="Appointment slip" />
              <CardBody className="grid gap-3 pt-3 text-sm text-muted">
                {canPrintSlip(appointment.status) ? (
                  <>
                    <p>Bring the slip to your consultation.</p>
                    <Link href={`/student/appointments/${appointment.id}/slip`} className={buttonClasses({ className: "w-fit" })}>
                      <PrinterIcon aria-hidden className="size-4" weight="bold" />
                      Print slip
                    </Link>
                  </>
                ) : (
                  <p>The slip is available once your lecturer approves this appointment.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {appointment.note && (
        <Card>
          <CardHeader
            title="Consultation notes"
            description={`Recorded ${formatTimestamp(appointment.note.recordedAt)}. Only you and your lecturer can see these.`}
            action={<NotebookIcon aria-hidden className="size-6 text-muted" />}
          />
          <CardBody className="grid gap-5 pt-3 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted">Notes</h3>
              <p className="mt-1 whitespace-pre-line leading-relaxed">{appointment.note.notes}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted">Action plan</h3>
              <p className="mt-1 whitespace-pre-line leading-relaxed">{appointment.note.actionPlan ?? "None recorded."}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
