import { CalendarXIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/student/booking-form";
import { LecturerCard } from "@/components/student/lecturer-card";
import { toSlotOptions } from "@/components/student/slot-options";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getAssignedLecturer, getAvailableSlots } from "@/server/queries/student";

export const metadata: Metadata = { title: "Book appointment | SCAS" };

/** FR05 Book Appointment (UI3, SD3 steps 1-8: openBookingForm). `?slot=` preselects a slot from the dashboard. */
export default async function BookPage({ searchParams }: { searchParams: Promise<{ slot?: string | string[] }> }) {
  const user = await requireRole("STUDENT");
  const [student, params] = await Promise.all([getAssignedLecturer(user.id), searchParams]);
  const lecturer = student?.lecturer ?? null;

  if (!lecturer) return <LecturerCard lecturer={null} />;

  const slots = toSlotOptions(await getAvailableSlots(lecturer.lecturerId, lecturer.limit));
  const slotParam = Array.isArray(params.slot) ? params.slot[0] : params.slot;

  if (!slots.some((s) => !s.booked && !s.closedReason)) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="No open slots to book"
        action={
          <Link href="/student/lecturer" className={buttonClasses({ variant: "secondary" })}>
            View your lecturer
          </Link>
        }
      >
        {lecturer.user.name} has no open consultation slots in the next four weeks. Try again later or contact them by e-mail.
      </EmptyState>
    );
  }

  return <BookingForm slots={slots} initialSlotId={slotParam ? Number(slotParam) : undefined} lecturerName={lecturer.user.name} />;
}
