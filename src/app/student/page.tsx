import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/layout/placeholder-dashboard";

export const metadata: Metadata = { title: "Student dashboard | SCAS" };

export default function StudentDashboard() {
  return <PlaceholderDashboard role="STUDENT" module="module 3" />;
}
