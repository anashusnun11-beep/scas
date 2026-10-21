import { CalendarXIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/student/booking-form";
import { LecturerDirectory } from "@/components/student/lecturer-directory";
import { toSlotOptions } from "@/components/student/slot-options";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getAvailableSlots, getLecturerDirectory, getLecturerForStudent, getSlotLecturerId } from "@/server/queries/student";

export const metadata: Metadata = { title: "Book appointment | SCAS" };

type SearchParams = Promise<{ lecturer?: string | string[]; slot?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * FR05 Book Appointment (UI3, SD3 steps 1-8: openBookingForm). Step 1 picks the lecturer (any active one,
 * decision 2026-10-21), step 2 is the form. `?slot=` (from a slot board) opens that slot's lecturer with it selected.
 */
export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("STUDENT");
  const params = await searchParams;
  const slotParam = Number(first(params.slot));
  const lecturerId = (Number.isInteger(slotParam) && (await getSlotLecturerId(slotParam))) || first(params.lecturer);
  const lecturer = lecturerId ? await getLecturerForStudent(lecturerId) : null;

  if (!lecturer) {
    const lecturers = await getLecturerDirectory();
    return (
      <Card>
        <CardHeader title="Book a consultation" description="Step 1 of 2: choose the lecturer you want to see." />
        <CardBody>
          <LecturerDirectory lecturers={lecturers} hrefFor={(id) => `/student/book?lecturer=${encodeURIComponent(id)}`} />
        </CardBody>
      </Card>
    );
  }

  const slots = toSlotOptions(await getAvailableSlots(lecturer.lecturerId, lecturer.limit));

  if (!slots.some((s) => !s.booked && !s.closedReason)) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="No open slots to book"
        action={
          <Link href="/student/book" className={buttonClasses({ variant: "secondary" })}>
            Choose another lecturer
          </Link>
        }
      >
        {lecturer.user.name} has no open consultation slots in the next four weeks. Try another lecturer, or contact them by e-mail.
      </EmptyState>
    );
  }

  return (
    <BookingForm
      key={lecturer.lecturerId}
      slots={slots}
      initialSlotId={Number.isInteger(slotParam) ? slotParam : undefined}
      lecturerName={lecturer.user.name}
    />
  );
}
