"use server";

import type { ActionResult } from "@/lib/action-result";
import { fieldErrors } from "@/lib/validation/auth";
import { slotSchema, type SlotInput } from "@/lib/validation/slot";
import { requireLecturer } from "@/server/lecturer-context";
import { deleteSlot, saveSlot, SlotError } from "@/server/services/slots";

/** FR09 add / edit a slot (SlotController.saveSlot). */
export async function saveSlotAction(formData: FormData): Promise<ActionResult<SlotInput>> {
  const { lecturerId } = await requireLecturer();
  const parsed = slotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await saveSlot(lecturerId, parsed.data);
    return { ok: true, message: parsed.data.slotId ? "Slot updated." : "Slot added." };
  } catch (error) {
    if (error instanceof SlotError) {
      return error.field ? { ok: false, errors: { [error.field]: error.message } } : { ok: false, errors: {}, message: error.message };
    }
    throw error;
  }
}

/** FR09 remove a slot that was never booked. */
export async function deleteSlotAction(slotId: number): Promise<ActionResult<SlotInput>> {
  const { lecturerId } = await requireLecturer();
  if (!Number.isInteger(slotId) || slotId < 1) return { ok: false, errors: {}, message: "That slot no longer exists." };
  try {
    await deleteSlot(lecturerId, slotId);
    return { ok: true, message: "Slot deleted." };
  } catch (error) {
    if (error instanceof SlotError) return { ok: false, errors: {}, message: error.message };
    throw error;
  }
}
