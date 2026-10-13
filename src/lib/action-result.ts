import type { FieldErrors } from "@/lib/validation/auth";

/** What every form server action returns: where to go next, or errors to show inline. */
export type ActionResult<T> =
  | { ok: true; redirectTo?: string; message?: string }
  | { ok: false; errors: FieldErrors<T>; message?: string };
