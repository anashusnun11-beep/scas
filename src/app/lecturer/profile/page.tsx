import type { Metadata } from "next";
import { PhoneForm } from "@/components/profile/phone-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireLecturer } from "@/server/lecturer-context";

export const metadata: Metadata = { title: "Profile | SCAS" };

/** Lecturer profile: details are managed by the admin (FR15); the phone number is yours to update. */
export default async function LecturerProfilePage() {
  const { lecturer, lecturerId } = await requireLecturer();
  const rows: [string, string][] = [
    ["Name", lecturer.user.name],
    ["E-mail", lecturer.user.email],
    ["Lecturer ID", lecturerId],
    ["Position", lecturer.position ?? "Not set"],
    ["Department", lecturer.department ?? "Not set"],
    ["Office", lecturer.officeRoom ?? "Not set"],
  ];

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader title="Your details" description="Students see these on their dashboard. To change them, contact the admin office." />
        <CardBody>
          <dl className="divide-y divide-line">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className={label === "Lecturer ID" ? "font-mono" : undefined}>{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contact" />
        <CardBody>
          <PhoneForm phoneNo={lecturer.user.phoneNo} hint="Shown to your students on their dashboard." />
        </CardBody>
      </Card>
    </div>
  );
}
