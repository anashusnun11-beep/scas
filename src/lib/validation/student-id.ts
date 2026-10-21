import { z } from "zod";
import { normalizeStudentId, STUDENT_ID_EXAMPLE, STUDENT_ID_PATTERN } from "@/lib/student-id";

export const STUDENT_ID_FORMAT_MESSAGE = `Format Student ID: ${STUDENT_ID_EXAMPLE} (programme code BCS, BDA, BDB, BLH or CFAB, then 7 digits; the "-" is optional).`;

/**
 * Student ID field for sign up (FR01), booking (FR05) and the admin form (FR14). Accepts lowercase
 * input and a missing dash, outputs the stored form (e.g. BCS2403-019).
 *
 * Built from toUpperCase() + regex + overwrite() rather than a transform on purpose: a failing
 * transform aborts the parse, which would hide other form errors such as "Passwords do not match".
 */
export const studentIdSchema = z
  .string()
  .trim()
  .min(1, "Enter your student ID.")
  .toUpperCase()
  .regex(STUDENT_ID_PATTERN, STUDENT_ID_FORMAT_MESSAGE)
  .overwrite(normalizeStudentId);
