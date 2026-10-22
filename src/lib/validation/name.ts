import { z } from "zod";

/**
 * A person's full name, for sign up (FR01) and the admin student / lecturer forms (FR14, FR15).
 * Letters of any script plus the marks Malaysian names use ("Dr.", "a/l", "a/p", "O'Neil", "Siti-Aishah");
 * no digits, emoji or other symbols (decision 2026-10-23). Repeated spaces collapse to one.
 */
export const personNameSchema = z
  .string()
  .trim()
  .overwrite((v) => v.replace(/\s+/g, " "))
  .min(3, "Enter the full name.")
  .max(100, "Name must be 100 characters or fewer.")
  .regex(/^\p{L}[\p{L}\p{M} .'’\-/()]*$/u, "Use letters only in the name (spaces and . ' - / ( ) are fine), no numbers or symbols.");
