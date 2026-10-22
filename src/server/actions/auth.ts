"use server";

import { Prisma } from "@/generated/prisma/client";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { roleHome } from "@/lib/navigation";
import { parseStudentId } from "@/lib/student-id";
import { fieldErrors, loginSchema, signupSchema, type FieldErrors, type LoginInput, type SignupInput } from "@/lib/validation/auth";
import { prisma } from "@/server/db";

// AuthController (SDD): signUp, login, logout. These are the only server actions that run before
// a session exists, so they are the only ones without requireRole().

/** FR01 / SD1 steps 2-9: validate, reject duplicates, hash, insert. Students only. */
export async function signUpAction(formData: FormData): Promise<ActionResult<SignupInput>> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { name, email, studentId, password } = parsed.data;

  const [emailTaken, idTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.student.findUnique({ where: { studentId }, select: { studentId: true } }),
  ]);
  const errors: FieldErrors<SignupInput> = {};
  if (emailTaken) errors.email = "This e-mail is already registered. Log in instead.";
  if (idTaken) errors.studentId = "This student ID is already registered.";
  if (errors.email || errors.studentId) return { ok: false, errors };

  try {
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        // Programme comes from the code in the ID (BCS, BDA, BDB, BLH). The admin assigns a lecturer later (FR14).
        student: { create: { studentId, programme: parseStudentId(studentId)?.programme } },
      },
    });
  } catch (error) {
    // Two sign-ups with the same e-mail or ID at the same moment: the UNIQUE constraint decides.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, errors: { email: "This e-mail or student ID is already registered." } };
    }
    throw error;
  }

  return { ok: true, redirectTo: "/login?registered=1" };
}

/** Only follow a callbackUrl that stays inside the user's own area. */
function safeRedirect(callbackUrl: FormDataEntryValue | null, home: string) {
  if (typeof callbackUrl !== "string") return home;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return home;
  return callbackUrl === home || callbackUrl.startsWith(`${home}/`) ? callbackUrl : home;
}

/** FR02 / SD1 steps 12-18: verify credentials, create the session, send the user to their dashboard. */
export async function loginAction(formData: FormData): Promise<ActionResult<LoginInput>> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return {
        ok: false,
        errors: {},
        message:
          error.code === "inactive"
            ? "This account has been deactivated. Please contact the admin office."
            : "E-mail or password is incorrect.",
      };
    }
    if (error instanceof AuthError) {
      return { ok: false, errors: {}, message: "We could not log you in right now. Please try again." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { role: true } });
  if (!user) return { ok: false, errors: {}, message: "E-mail or password is incorrect." };
  return { ok: true, redirectTo: safeRedirect(formData.get("callbackUrl"), roleHome[user.role]) };
}

/** FR02: logout from the sidebar. The form's no-JavaScript path: clears the session and redirects. */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * FR02 logout with JavaScript: clears the session only; the button then reloads /login itself, so no
 * client state of the signed-out user (forms, cached pages) survives (Next.js "State and authentication").
 */
export async function signOutAction() {
  await signOut({ redirect: false });
}
