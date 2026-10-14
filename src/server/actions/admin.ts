"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/guard";
import {
  createLecturerSchema,
  createStudentSchema,
  resetPasswordSchema,
  updateLecturerSchema,
  updateStudentSchema,
  type LecturerFormInput,
  type ResetPasswordInput,
  type StudentFormInput,
} from "@/lib/validation/admin";
import { fieldErrors } from "@/lib/validation/auth";
import {
  AdminError,
  createLecturer,
  createStudent,
  deactivateLecturer,
  deactivateStudent,
  reactivateUser,
  resetPassword,
  updateLecturer,
  updateStudent,
} from "@/server/services/admin-users";

// FR14 / FR15 admin actions. Every one checks the ADMIN role first (NFR02).

function fail<T>(error: unknown): ActionResult<T> {
  if (error instanceof AdminError) {
    return error.field ? { ok: false, errors: { [error.field]: error.message } as never, message: error.message } : { ok: false, errors: {}, message: error.message };
  }
  throw error;
}

/** FR14 add student (SD11). */
export async function createStudentAction(formData: FormData): Promise<ActionResult<StudentFormInput>> {
  await requireRole("ADMIN");
  const parsed = createStudentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const student = await createStudent(parsed.data);
    return { ok: true, redirectTo: `/admin/students/${encodeURIComponent(student.studentId)}`, message: "Student added." };
  } catch (error) {
    return fail(error);
  }
}

/** FR14 edit student (SD11). */
export async function updateStudentAction(formData: FormData): Promise<ActionResult<StudentFormInput>> {
  await requireRole("ADMIN");
  const parsed = updateStudentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const student = await updateStudent(parsed.data);
    return { ok: true, redirectTo: `/admin/students/${encodeURIComponent(student.studentId)}`, message: "Student info saved." };
  } catch (error) {
    return fail(error);
  }
}

/** FR14 Deactivate (SD11 opt): soft delete, cancels the student's upcoming appointments. */
export async function deactivateStudentAction(studentId: string): Promise<ActionResult<StudentFormInput>> {
  await requireRole("ADMIN");
  try {
    const { cancelled } = await deactivateStudent(String(studentId));
    return {
      ok: true,
      message: cancelled ? `Student deactivated. ${cancelled} upcoming appointment${cancelled === 1 ? " was" : "s were"} cancelled.` : "Student deactivated.",
    };
  } catch (error) {
    return fail(error);
  }
}

/** FR15 add lecturer (SD12). */
export async function createLecturerAction(formData: FormData): Promise<ActionResult<LecturerFormInput>> {
  await requireRole("ADMIN");
  const parsed = createLecturerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const lecturer = await createLecturer(parsed.data);
    return { ok: true, redirectTo: `/admin/lecturers/${encodeURIComponent(lecturer.lecturerId)}`, message: "Lecturer added." };
  } catch (error) {
    return fail(error);
  }
}

/** FR15 edit lecturer (SD12). */
export async function updateLecturerAction(formData: FormData): Promise<ActionResult<LecturerFormInput>> {
  await requireRole("ADMIN");
  const parsed = updateLecturerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const lecturer = await updateLecturer(parsed.data);
    return { ok: true, redirectTo: `/admin/lecturers/${encodeURIComponent(lecturer.lecturerId)}`, message: "Lecturer info saved." };
  } catch (error) {
    return fail(error);
  }
}

/** FR15 Deactivate (SD12 opt): blocked while the lecturer has active appointments or assigned students. */
export async function deactivateLecturerAction(lecturerId: string): Promise<ActionResult<LecturerFormInput>> {
  await requireRole("ADMIN");
  try {
    await deactivateLecturer(String(lecturerId));
    return { ok: true, message: "Lecturer deactivated." };
  } catch (error) {
    return fail(error);
  }
}

/** Reactivate a student or lecturer account. */
export async function reactivateAction(userId: number): Promise<ActionResult<StudentFormInput>> {
  await requireRole("ADMIN");
  try {
    await reactivateUser(Number(userId));
    return { ok: true, message: "Account reactivated. They can log in again." };
  } catch (error) {
    return fail(error);
  }
}

/** Set a new temporary password for a student or lecturer. */
export async function resetPasswordAction(formData: FormData): Promise<ActionResult<ResetPasswordInput>> {
  await requireRole("ADMIN");
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await resetPassword(parsed.data.userId, parsed.data.password);
    return { ok: true, message: "Temporary password set. Give it to the user in person." };
  } catch (error) {
    return fail(error);
  }
}
