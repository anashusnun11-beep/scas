import type { Metadata } from "next";
import { StudentAppointmentView } from "@/components/student/appointment-view";

export const metadata: Metadata = { title: "Past appointment | SCAS" };

/** A past appointment (FR08). Upcoming ones redirect to /student/appointments/[id]. */
export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentAppointmentView id={id} scope="past" />;
}
