import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getLecturerForUser } from "@/server/queries/lecturer";

/** requireRole("LECTURER") plus the lecturer record. Every lecturer page and action starts here (NFR02). */
export async function requireLecturer() {
  const user = await requireRole("LECTURER");
  const lecturer = await getLecturerForUser(user.id);
  // A LECTURER user without a lecturer row is a data problem: treat it as signed out rather than crash.
  if (!lecturer) redirect("/login?reason=signed-out");
  return { user, lecturer, lecturerId: lecturer.lecturerId };
}
