import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { AppointmentList } from "@/components/student/appointment-list";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getHistory } from "@/server/queries/student";

export const metadata: Metadata = { title: "Appointment history | SCAS" };

/** FR08 View Appointment History (student, SD5): past appointments; open one for details and notes. */
export default async function HistoryPage() {
  const user = await requireRole("STUDENT");
  const appointments = await getHistory(user.id);

  if (appointments.length === 0) {
    return (
      <EmptyState icon={ClockCounterClockwiseIcon} title="No past appointments yet">
        Appointments move here after their date has passed. Open one to read your lecturer&apos;s consultation notes.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardHeader title="Past appointments" description="Newest first. Open one for details and consultation notes." />
      <div className="mt-3 border-t border-line">
        <AppointmentList appointments={appointments} />
      </div>
    </Card>
  );
}
