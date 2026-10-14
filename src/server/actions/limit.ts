"use server";

import type { ActionResult } from "@/lib/action-result";
import { DEFAULT_LIMIT } from "@/lib/limits";
import { fieldErrors } from "@/lib/validation/auth";
import { limitSchema, type LimitInput } from "@/lib/validation/limit";
import { requireLecturer } from "@/server/lecturer-context";
import { saveLimit } from "@/server/services/limits";

/** FR13 Set Consultation Limitation (SD10 steps 8-12, LimitController.saveLimit). */
export async function saveLimitAction(formData: FormData): Promise<ActionResult<LimitInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = limitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Some values are not valid. Check the highlighted fields." };
  await saveLimit(lecturerId, parsed.data);
  return { ok: true, message: "Consultation limitation updated." };
}

/** "Reset to default" (UI9). */
export async function resetLimitAction(): Promise<ActionResult<LimitInput>> {
  const { lecturerId } = await requireLecturer();
  await saveLimit(lecturerId, { ...DEFAULT_LIMIT });
  return { ok: true, message: "Consultation limitation reset to the defaults." };
}
