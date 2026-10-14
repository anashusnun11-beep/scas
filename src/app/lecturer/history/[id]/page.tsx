import type { Metadata } from "next";
import { LecturerAppointmentView } from "@/components/lecturer/appointment-view";

export const metadata: Metadata = { title: "Past appointment | SCAS" };

export default async function LecturerHistoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LecturerAppointmentView id={id} section="history" />;
}
