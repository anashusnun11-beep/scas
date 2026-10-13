import type { Metadata } from "next";
import { LecturerCard } from "@/components/student/lecturer-card";
import { SlotBoard } from "@/components/student/slot-board";
import { toSlotOptions } from "@/components/student/slot-options";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { BOOKING_WINDOW_DAYS, getAssignedLecturer, getAvailableSlots } from "@/server/queries/student";

export const metadata: Metadata = { title: "My lecturer | SCAS" };

/** FR03 View Assigned Lecturer Details, with «extend» FR04 View Available Lecturer Slot (SD2). */
export default async function MyLecturerPage() {
  const user = await requireRole("STUDENT");
  const student = await getAssignedLecturer(user.id);
  const lecturer = student?.lecturer ?? null;
  const slots = lecturer ? toSlotOptions(await getAvailableSlots(lecturer.lecturerId, lecturer.limit)) : [];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <LecturerCard lecturer={lecturer} />
      {lecturer && (
        <Card>
          <CardHeader
            title="Available slots"
            description={`The next ${BOOKING_WINDOW_DAYS / 7} weeks. Pick an open slot to book it.`}
          />
          <CardBody>
            <SlotBoard slots={slots} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
