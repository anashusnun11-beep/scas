import type { Metadata } from "next";
import { StudentAppointmentView } from "@/components/student/appointment-view";

export const metadata: Metadata = { title: "Appointment | SCAS" };

/** An upcoming appointment (FR06). Past ones redirect to /student/history/[id]. */
export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <StudentAppointmentView id={id} scope="upcoming" booked={Boolean(query.booked)} />;
}
