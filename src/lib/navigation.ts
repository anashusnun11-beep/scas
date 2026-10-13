/** Sidebar menus per role. Icons are keys so this file stays plain data (usable on the server). */

export type Role = "STUDENT" | "LECTURER" | "ADMIN";

export type NavIcon =
  | "dashboard"
  | "lecturer"
  | "book"
  | "status"
  | "history"
  | "profile"
  | "requests"
  | "slots"
  | "appointments"
  | "limits"
  | "students"
  | "lecturers"
  | "reports";

export type NavItem = { href: string; label: string; icon: NavIcon };

export const navigation: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Dashboard", icon: "dashboard" },
    { href: "/student/lecturer", label: "My Lecturer", icon: "lecturer" },
    { href: "/student/book", label: "Book Appointment", icon: "book" },
    { href: "/student/appointments", label: "Appointment Status", icon: "status" },
    { href: "/student/history", label: "Appointment History", icon: "history" },
    { href: "/student/profile", label: "Profile", icon: "profile" },
  ],
  LECTURER: [
    { href: "/lecturer", label: "Dashboard", icon: "dashboard" },
    { href: "/lecturer/requests", label: "Booking Requests", icon: "requests" },
    { href: "/lecturer/appointments", label: "Appointments", icon: "appointments" },
    { href: "/lecturer/slots", label: "Manage Availability", icon: "slots" },
    { href: "/lecturer/limits", label: "Consultation Limit", icon: "limits" },
    { href: "/lecturer/history", label: "Appointment History", icon: "history" },
    { href: "/lecturer/profile", label: "Profile", icon: "profile" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/students", label: "Manage Students", icon: "students" },
    { href: "/admin/lecturers", label: "Manage Lecturers", icon: "lecturers" },
    { href: "/admin/reports", label: "Generate Report", icon: "reports" },
  ],
};

export const roleLabel: Record<Role, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  ADMIN: "Administrator",
};
