import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/admin/account-panel";
import { LecturerForm } from "@/components/admin/lecturer-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { formatTimestamp } from "@/lib/dates";
import { getLecturerForEdit } from "@/server/queries/admin";
import { blockerMessage, lecturerBlockers } from "@/server/services/admin-users";

export const metadata: Metadata = { title: "Lecturer | SCAS" };

/** FR15 view / update / deactivate one lecturer (SD12). */
export default async function LecturerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const lecturer = await getLecturerForEdit(decodeURIComponent(id));
  if (!lecturer) notFound();

  const blockers = await lecturerBlockers(lecturer.lecturerId);
  const blocked =
    lecturer.user.accountStatus === "ACTIVE" && blockers.activeAppointments
      ? blockerMessage(lecturer.user.name, blockers)
      : undefined;

  return (
    <div className="grid gap-6">
      <Link href="/admin/lecturers" className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Lecturers
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={lecturer.user.name} description={`${lecturer.lecturerId}. Account created ${formatTimestamp(lecturer.user.createdAt)}.`} />
          <CardBody>
            <LecturerForm
              key={lecturer.lecturerId}
              mode="edit"
              idLocked={lecturer._count.appointments > 0}
              initial={{
                name: lecturer.user.name,
                email: lecturer.user.email,
                phoneNo: lecturer.user.phoneNo ?? "",
                lecturerId: lecturer.lecturerId,
                department: lecturer.department ?? "",
                officeRoom: lecturer.officeRoom ?? "",
                position: lecturer.position ?? "",
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Account" />
          <CardBody className="grid gap-4">
            <dl className="grid gap-3 text-sm">
              <div className="rounded-control bg-surface-2 p-3">
                <dt className="text-muted">Active appointments</dt>
                <dd className="font-display text-2xl font-bold">{blockers.activeAppointments}</dd>
              </div>
            </dl>
            <AccountPanel
              key={lecturer.user.accountStatus}
              kind="lecturer"
              userId={lecturer.user.id}
              recordId={lecturer.lecturerId}
              name={lecturer.user.name}
              status={lecturer.user.accountStatus}
              blocked={blocked}
              consequence="Nothing depends on this lecturer any more, so they can be deactivated."
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
