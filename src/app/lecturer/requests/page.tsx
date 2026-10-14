import { TrayIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { toAppointmentItem, toSlotChoices } from "@/components/lecturer/items";
import { RequestList } from "@/components/lecturer/request-list";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireLecturer } from "@/server/lecturer-context";
import { getPendingRequests, getRescheduleOptions } from "@/server/queries/lecturer";

export const metadata: Metadata = { title: "Booking requests | SCAS" };

/** FR10 Approve / Reject Appointment with «include» View Booking Appointment (UI6, SD7). */
export default async function RequestsPage() {
  const { lecturerId } = await requireLecturer();
  const [requests, options] = await Promise.all([getPendingRequests(lecturerId), getRescheduleOptions(lecturerId)]);
  const now = new Date();

  if (requests.length === 0) {
    return (
      <EmptyState icon={TrayIcon} title="No pending requests">
        New bookings from your students appear here for you to approve, reject or reschedule.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardHeader title={`${requests.length} pending request${requests.length === 1 ? "" : "s"}`} description="Soonest first. Rejecting needs a reason and opens the slot again." />
      <div className="mt-3 border-t border-line">
        <RequestList items={requests.map((r) => toAppointmentItem(r, now))} slotChoices={toSlotChoices(options)} />
      </div>
    </Card>
  );
}
