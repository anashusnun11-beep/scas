import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/layout/placeholder-dashboard";

export const metadata: Metadata = { title: "Lecturer dashboard | SCAS" };

export default function LecturerDashboard() {
  return <PlaceholderDashboard role="LECTURER" module="module 4" />;
}
