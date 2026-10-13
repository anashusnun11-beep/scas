import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentList } from "@/components/student/appointment-list";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getMyAppointments } from "@/server/queries/student";

export const metadata: Metadata = { title: "Appointment status | SCAS" };

/** FR06 View Appointment Status (UI4): today and later, every status, with the lecturer's remarks. */
export default async function AppointmentStatusPage() {
  const user = await requireRole("STUDENT");
  const appointments = await getMyAppointments(user.id, "upcoming");
  const book = (
    <Link href="/student/book" className={buttonClasses()}>
      Book appointment
    </Link>
  );

  if (appointments.length === 0) {
    return (
      <EmptyState icon={CalendarBlankIcon} title="No upcoming appointments" action={book}>
        When you book a consultation it appears here with its status. Past appointments are in Appointment History.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Upcoming appointments"
        description="Open one for details. The slip can be printed once it is approved."
        action={book}
      />
      <div className="mt-3 border-t border-line">
        <AppointmentList appointments={appointments} />
      </div>
    </Card>
  );
}
