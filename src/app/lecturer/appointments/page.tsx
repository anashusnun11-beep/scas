import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { AppointmentRows } from "@/components/lecturer/appointment-rows";
import { toAppointmentItem } from "@/components/lecturer/items";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireLecturer } from "@/server/lecturer-context";
import { getActiveAppointments } from "@/server/queries/lecturer";

export const metadata: Metadata = { title: "Appointments | SCAS" };

/** Confirmed appointments: record notes (FR12) for those that started, reschedule or cancel (FR11) the rest. */
export default async function LecturerAppointmentsPage() {
  const { lecturerId } = await requireLecturer();
  const now = new Date();
  const { needsNotes, upcoming } = await getActiveAppointments(lecturerId, now);

  if (needsNotes.length === 0 && upcoming.length === 0) {
    return (
      <EmptyState icon={CalendarCheckIcon} title="No confirmed appointments">
        Approved requests appear here. Open one to reschedule, cancel or record the consultation notes.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6">
      {needsNotes.length > 0 && (
        <Card>
          <CardHeader title="Waiting for notes" description="These consultations have started. Record the notes to complete them." />
          <div className="mt-3 border-t border-line">
            <AppointmentRows items={needsNotes.map((r) => toAppointmentItem(r, now))} showNeedsNotes />
          </div>
        </Card>
      )}
      <Card>
        <CardHeader title="Upcoming" description="Open one to reschedule or cancel." />
        {upcoming.length === 0 ? (
          <p className="px-5 pb-5 pt-3 text-sm text-muted">Nothing upcoming yet.</p>
        ) : (
          <div className="mt-3 border-t border-line">
            <AppointmentRows items={upcoming.map((r) => toAppointmentItem(r, now))} />
          </div>
        )}
      </Card>
    </div>
  );
}
