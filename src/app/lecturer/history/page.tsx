import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { AppointmentRows } from "@/components/lecturer/appointment-rows";
import { toAppointmentItem } from "@/components/lecturer/items";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireLecturer } from "@/server/lecturer-context";
import { getLecturerHistory } from "@/server/queries/lecturer";

export const metadata: Metadata = { title: "Appointment history | SCAS" };

/** FR08 View Appointment History for the lecturer (SD5): completed, rejected and cancelled. */
export default async function LecturerHistoryPage() {
  const { lecturerId } = await requireLecturer();
  const rows = await getLecturerHistory(lecturerId);
  const now = new Date();

  if (rows.length === 0) {
    return (
      <EmptyState icon={ClockCounterClockwiseIcon} title="No finished appointments yet">
        Completed, rejected and cancelled appointments are kept here with their notes and reasons.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardHeader title="Finished appointments" description="Newest first. Open one to read or edit the consultation notes." />
      <div className="mt-3 border-t border-line">
        <AppointmentRows items={rows.map((r) => toAppointmentItem(r, now))} />
      </div>
    </Card>
  );
}
