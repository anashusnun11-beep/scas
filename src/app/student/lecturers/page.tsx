import type { Metadata } from "next";
import { LecturerDirectory } from "@/components/student/lecturer-directory";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { BOOKING_WINDOW_DAYS, getLecturerDirectory } from "@/server/queries/student";

export const metadata: Metadata = { title: "Lecturers | SCAS" };

/** FR03 View Lecturer Details for every active lecturer (SD2); open one for their slots (FR04). */
export default async function LecturersPage() {
  await requireRole("STUDENT");
  const lecturers = await getLecturerDirectory();

  return (
    <Card>
      <CardHeader
        title="Lecturers"
        description={`You can book a consultation with any lecturer. Open slots cover the next ${BOOKING_WINDOW_DAYS / 7} weeks.`}
      />
      <CardBody>
        <LecturerDirectory lecturers={lecturers} />
      </CardBody>
    </Card>
  );
}
