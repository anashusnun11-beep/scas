import { ArrowLeftIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KpmLogo } from "@/components/brand/kpm-logo";
import { AppointmentFacts } from "@/components/student/appointment-facts";
import { PrintButton } from "@/components/student/print-button";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { appointmentCode, canPrintSlip } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { formatTimestamp } from "@/lib/dates";
import { getAppointmentDetail } from "@/server/queries/student";

export const metadata: Metadata = { title: "Appointment slip | SCAS" };

/** FR07 Print Appointment Slip (UI5, SlipController.generateSlip). Only for APPROVED / RESCHEDULED (BR5). */
export default async function SlipPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("STUDENT");
  const { id } = await params;
  const appointment = await getAppointmentDetail(user.id, Number(id));
  if (!appointment) notFound();

  const back = (
    <Link href={`/student/appointments/${appointment.id}`} className={buttonClasses({ variant: "secondary", className: "print:hidden" })}>
      <ArrowLeftIcon aria-hidden className="size-4" />
      Back
    </Link>
  );

  if (!canPrintSlip(appointment.status)) {
    return (
      <EmptyState icon={PrinterIcon} title="No slip for this appointment yet" action={back}>
        The slip is only available for approved appointments. This one is {appointment.status}.
      </EmptyState>
    );
  }

  return (
    <div className="grid justify-items-center gap-6">
      {/* Always light, so it prints the same whatever theme the student uses. */}
      <article
        data-theme="light"
        className="w-full max-w-2xl rounded-card border border-line bg-surface p-6 text-ink shadow-card sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5">
          <div className="flex items-center gap-4">
            <KpmLogo className="h-14 p-0" priority />
            <div>
              <h2 className="font-display text-title font-bold leading-tight">Appointment slip</h2>
              <p className="text-sm text-muted">Student Consultation Appointment System, KPM Beranang</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{appointmentCode(appointment.id)}</p>
            <p className="text-xs text-muted">Printed {formatTimestamp(new Date())}</p>
          </div>
        </header>
        <div className="mt-4">
          <AppointmentFacts appointment={appointment} showStudent />
        </div>
        <p className="mt-6 text-sm text-muted">
          Please arrive 5 minutes early and bring this slip. If you can&apos;t attend, contact your lecturer as soon as possible.
        </p>
      </article>

      <div className="flex gap-3 print:hidden">
        {back}
        <PrintButton />
      </div>
    </div>
  );
}
