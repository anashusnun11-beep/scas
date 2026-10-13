import type { Metadata } from "next";
import { PlaceholderDashboard } from "@/components/layout/placeholder-dashboard";

export const metadata: Metadata = { title: "Admin dashboard | SCAS" };

export default function AdminDashboard() {
  return <PlaceholderDashboard role="ADMIN" module="module 5" />;
}
