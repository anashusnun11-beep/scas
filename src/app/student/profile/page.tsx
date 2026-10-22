import type { Metadata } from "next";
import { PhoneForm } from "@/components/profile/phone-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { getStudentProfile } from "@/server/queries/student";

export const metadata: Metadata = { title: "Profile | SCAS" };

/** Profile: view your details, update your phone number. Everything else is managed by the admin (FR14). */
export default async function ProfilePage() {
  const user = await requireRole("STUDENT");
  const student = await getStudentProfile(user.id);

  const rows: [string, string][] = [
    ["Name", user.name],
    ["E-mail", user.email],
    ["Student ID", student?.studentId ?? "Not set"],
    ["Programme", student?.programme ?? "Not set"],
    ["Semester", student?.semester ? String(student.semester) : "Not set"],
  ];

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader title="Your details" description="To change these, contact the admin office." />
        <CardBody>
          <dl className="divide-y divide-line">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className={label === "Student ID" ? "font-mono" : "[overflow-wrap:anywhere]"}>{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contact" />
        <CardBody>
          <PhoneForm phoneNo={student?.user.phoneNo ?? null} hint="Your lecturer may call you about an appointment." />
        </CardBody>
      </Card>
    </div>
  );
}
