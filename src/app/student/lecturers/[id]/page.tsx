import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LecturerCard } from "@/components/student/lecturer-card";
import { SlotBoard } from "@/components/student/slot-board";
import { toSlotOptions } from "@/components/student/slot-options";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { BOOKING_WINDOW_DAYS, getAvailableSlots, getLecturerForStudent } from "@/server/queries/student";

export const metadata: Metadata = { title: "Lecturer | SCAS" };

/** FR03 View Lecturer Details, with «extend» FR04 View Available Lecturer Slot (SD2). */
export default async function LecturerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("STUDENT");
  const { id } = await params;
  const lecturer = await getLecturerForStudent(decodeURIComponent(id));
  if (!lecturer) notFound();
  const slots = toSlotOptions(await getAvailableSlots(lecturer.lecturerId, lecturer.limit));
  const canBook = slots.some((s) => !s.booked && !s.closedReason);

  return (
    <div className="grid gap-6">
      <Link href="/student/lecturers" className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Lecturers
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <LecturerCard
          lecturer={lecturer}
          action={
            canBook && (
              <Link href={`/student/book?lecturer=${encodeURIComponent(lecturer.lecturerId)}`} className={buttonClasses({ className: "w-full sm:w-auto" })}>
                Book an appointment
              </Link>
            )
          }
        />
        <Card>
          <CardHeader title="Available slots" description={`The next ${BOOKING_WINDOW_DAYS / 7} weeks. Pick an open slot to book it.`} />
          <CardBody>
            <SlotBoard slots={slots} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
