import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge, type AppointmentStatus } from "@/components/ui/status-badge";
import type { Role } from "@/lib/navigation";
import { StatusDemo, ToastDemo } from "../../_components/demos";

const DEMO: Record<string, { role: Role; name: string; title: string }> = {
  student: { role: "STUDENT", name: "Aina Sofea binti Rahman", title: "Student Dashboard" },
  lecturer: { role: "LECTURER", name: "Dr. Nurul Huda binti Ismail", title: "Booking Requests" },
  admin: { role: "ADMIN", name: "Siti Aminah binti Yusof", title: "Admin Dashboard" },
};

// Sample rows for the demo only.
const ROWS: { id: string; date: string; time: string; purpose: string; status: AppointmentStatus }[] = [
  { id: "APT-0015", date: "Mon, 19 Oct", time: "10:00 - 10:30", purpose: "Course registration advice", status: "PENDING" },
  { id: "APT-0012", date: "Tue, 20 Oct", time: "10:00 - 10:30", purpose: "FYP proposal discussion", status: "APPROVED" },
  { id: "APT-0009", date: "Wed, 14 Oct", time: "10:00 - 10:30", purpose: "Internship placement", status: "RESCHEDULED" },
  { id: "APT-0006", date: "Mon, 5 Oct", time: "10:00 - 10:30", purpose: "Result appeal", status: "COMPLETED" },
];

export function generateStaticParams() {
  return Object.keys(DEMO).map((role) => ({ role }));
}

export default async function ShellDemo({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const demo = DEMO[role];
  if (!demo) notFound();

  return (
    <AppShell
      role={demo.role}
      user={{ name: demo.name }}
      title={demo.title}
      footer={
        <Button variant="ghost" className="w-full justify-start text-muted hover:text-ink">
          <SignOutIcon aria-hidden className="size-5" />
          Log out
        </Button>
      }
    >
      <p className="mb-6 rounded-control border border-line bg-surface px-4 py-3 text-sm text-muted">
        Design system demo. The menu links lead to pages that are built in later modules.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Upcoming", "1"],
          ["Pending", "2"],
          ["Approved", "3"],
          ["Completed", "7"],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Appointments" description="Sample data" />
          <CardBody className="p-0 pt-3">
            <ul className="divide-y divide-line">
              {ROWS.map((r) => (
                <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.purpose}</p>
                    <p className="truncate font-mono text-xs text-muted">
                      {r.id} {r.date}, {r.time}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Status change" description="The badge flips when the lecturer acts." />
            <CardBody>
              <StatusDemo />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Feedback" />
            <CardBody>
              <ToastDemo />
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
