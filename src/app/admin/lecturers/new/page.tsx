import type { Metadata } from "next";
import { LecturerForm } from "@/components/admin/lecturer-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Add lecturer | SCAS" };

/** FR15 add lecturer, «include» Insert Lecturer ID (SD12). */
export default async function NewLecturerPage() {
  await requireRole("ADMIN");
  return (
    <Card className="max-w-4xl">
      <CardHeader title="Add a lecturer" description="They can log in straight away with the temporary password. Default consultation limits apply until they set their own." />
      <CardBody>
        <LecturerForm mode="create" />
      </CardBody>
    </Card>
  );
}
