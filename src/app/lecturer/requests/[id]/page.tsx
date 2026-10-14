import type { Metadata } from "next";
import { LecturerAppointmentView } from "@/components/lecturer/appointment-view";

export const metadata: Metadata = { title: "Booking request | SCAS" };

export default async function LecturerRequestsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LecturerAppointmentView id={id} section="requests" />;
}
