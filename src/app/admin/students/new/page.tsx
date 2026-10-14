import type { Metadata } from "next";
import { StudentForm } from "@/components/admin/student-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { getLecturerOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Add student | SCAS" };

/** FR14 add student, «include» Insert Student ID (SD11 steps 7-14). */
export default async function NewStudentPage() {
  await requireRole("ADMIN");
  const lecturers = await getLecturerOptions();
  return (
    <Card className="max-w-4xl">
      <CardHeader title="Add a student" description="They can log in straight away with the temporary password." />
      <CardBody>
        <StudentForm mode="create" lecturers={lecturers.map((l) => ({ lecturerId: l.lecturerId, name: l.user.name, department: l.department }))} />
      </CardBody>
    </Card>
  );
}
