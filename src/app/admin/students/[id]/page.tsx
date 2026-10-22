import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/admin/account-panel";
import { StudentForm } from "@/components/admin/student-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { formatTimestamp } from "@/lib/dates";
import { getStudentForEdit } from "@/server/queries/admin";
import { previewStudentDeactivation } from "@/server/services/admin-users";

export const metadata: Metadata = { title: "Student | SCAS" };

/** FR14 view / update / deactivate one student (SD11). */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const studentId = decodeURIComponent(id);
  const student = await getStudentForEdit(studentId);
  if (!student) notFound();

  const upcoming = student.user.accountStatus === "ACTIVE" ? await previewStudentDeactivation(student.studentId) : 0;

  return (
    <div className="grid gap-6">
      <Link href="/admin/students" className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Students
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={student.user.name} description={`${student.studentId}. Account created ${formatTimestamp(student.user.createdAt)}.`} />
          <CardBody>
            <StudentForm
              key={student.studentId}
              mode="edit"
              idLocked={student._count.appointments > 0}
              initial={{
                name: student.user.name,
                email: student.user.email,
                phoneNo: student.user.phoneNo ?? "",
                studentId: student.studentId,
                semester: student.semester ? String(student.semester) : "",
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <AccountPanel
              key={student.user.accountStatus}
              kind="student"
              userId={student.user.id}
              recordId={student.studentId}
              name={student.user.name}
              status={student.user.accountStatus}
              consequence={
                upcoming
                  ? `${upcoming} upcoming appointment${upcoming === 1 ? " will be" : "s will be"} cancelled and the slots opened again for other students.`
                  : "They have no upcoming appointments."
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
