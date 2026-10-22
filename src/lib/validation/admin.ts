import { z } from "zod";
import { passwordSchema } from "./auth";
import { personNameSchema } from "./name";
import { studentIdSchema } from "./student-id";

// FR14 / FR15 admin forms. Shared by the forms (client) and the admin actions (server).

/** Empty form fields become undefined, so optional fields stay optional. */
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const name = personNameSchema;
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter an e-mail address.")
  .max(100, "E-mail must be 100 characters or fewer.")
  .pipe(z.email("Enter a valid e-mail address."));
const phoneNo = optional(
  z
    .string()
    .trim()
    .max(15, "Phone number must be 15 characters or fewer.")
    .regex(/^\+?\d[\d -]{7,13}\d$/, "Enter a phone number like 012-345 6789."),
);

/** Lecturer / staff ID: letters and digits, 3 to 20, stored uppercase (decision 2026-10-14, real format unknown). */
export const lecturerIdSchema = z
  .string()
  .trim()
  .min(1, "Enter the lecturer ID.")
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, "Lecturer ID must be 3 to 20 letters or digits, e.g. LEC001.");

const studentFields = {
  name,
  email,
  phoneNo,
  studentId: studentIdSchema,
  semester: optional(z.coerce.number().int("Choose a semester.").min(1, "Choose a semester.").max(9, "Choose a semester.")),
};

/** FR14 add student (with a temporary password). */
export const createStudentSchema = z.object({ ...studentFields, password: passwordSchema });
/** FR14 edit student. `originalStudentId` identifies the record; `studentId` may change while it has no appointments. */
export const updateStudentSchema = z.object({ ...studentFields, originalStudentId: z.string().min(1) });

const lecturerFields = {
  name,
  email,
  phoneNo,
  lecturerId: lecturerIdSchema,
  department: z.string().trim().min(2, "Enter the department.").max(100, "Department must be 100 characters or fewer."),
  officeRoom: z.string().trim().min(2, "Enter the office room.").max(50, "Office room must be 50 characters or fewer."),
  position: optional(z.string().trim().max(50, "Position must be 50 characters or fewer.")),
};

/** FR15 add lecturer (with a temporary password). */
export const createLecturerSchema = z.object({ ...lecturerFields, password: passwordSchema });
/** FR15 edit lecturer. */
export const updateLecturerSchema = z.object({ ...lecturerFields, originalLecturerId: z.string().min(1) });

/** Reset password for an existing account (there is no "forgot password"). */
export const resetPasswordSchema = z.object({ userId: z.coerce.number().int().positive(), password: passwordSchema });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentFormInput = z.input<typeof createStudentSchema>;
export type CreateLecturerInput = z.infer<typeof createLecturerSchema>;
export type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;
export type LecturerFormInput = z.input<typeof createLecturerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
