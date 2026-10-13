import { z } from "zod";

// Shared by the forms (client) and the server actions / Auth.js authorize (server).

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your e-mail address.")
  .max(100, "E-mail must be 100 characters or fewer.")
  .pipe(z.email("Enter a valid e-mail address."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72, "Password must be 72 characters or fewer."),
});

/** Student ID: letters and digits, 5 to 20 characters, stored in uppercase (decision 2026-10-14). */
export const studentIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{5,20}$/, "Student ID must be 5 to 20 letters or digits, with no spaces.");

/** At least 8 characters with a letter and a number. 72 is bcrypt's input limit. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

export const signupSchema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name.").max(100, "Name must be 100 characters or fewer."),
    email,
    studentId: studentIdSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/** Field errors keyed by input name, for inline messages under each field. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function fieldErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const out: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T;
    if (key !== undefined && !out[key]) out[key] = issue.message;
  }
  return out;
}
