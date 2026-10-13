import { z } from "zod";
import { STUDENT_ID_EXAMPLE } from "@/lib/student-id";

export const STUDENT_ID_FORMAT_MESSAGE = `Format Student ID: ${STUDENT_ID_EXAMPLE} (programme code BCS, BDA, BDB or BLH, intake year, intake 01 to 03, then a number from 001 to 999).`;

// Same rule as STUDENT_ID_PATTERN in src/lib/student-id.ts, plus "not 000" so it stays one regex.
const FORMAT = /^(BCS|BDA|BDB|BLH)\d{2}0[1-3]-(?!000)\d{3}$/;

/**
 * Student ID field for sign up (FR01) and the admin form (FR14). Accepts lowercase input,
 * outputs the uppercase ID.
 *
 * Built from toUpperCase() + regex rather than a transform on purpose: a failing transform
 * aborts the parse, which would hide other form errors such as "Passwords do not match".
 */
export const studentIdSchema = z.string().trim().min(1, "Enter your student ID.").toUpperCase().regex(FORMAT, STUDENT_ID_FORMAT_MESSAGE);
