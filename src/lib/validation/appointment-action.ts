import { z } from "zod";

// FR10 / FR11 / FR12 forms used by the lecturer. Shared by the dialogs (client) and the actions (server).

const appointmentId = z.coerce.number().int().positive();

const reason = z
  .string()
  .trim()
  .min(5, "Give the student a short reason (at least 5 characters).")
  .max(500, "Keep the reason under 500 characters.");

/** Reject (FR10) and cancel (FR11) both need a reason the student will see. */
export const reasonSchema = z.object({ appointmentId, reason });

export const rescheduleSchema = z.object({
  appointmentId,
  newSlotId: z.coerce.number({ error: "Choose the new slot." }).int("Choose the new slot.").positive("Choose the new slot."),
  reason,
});

export const noteSchema = z.object({
  appointmentId,
  notes: z.string().trim().min(10, "Write what was discussed (at least 10 characters).").max(2000, "Keep the notes under 2000 characters."),
  actionPlan: z.string().trim().max(1000, "Keep the action plan under 1000 characters.").optional().default(""),
});

export type ReasonInput = z.infer<typeof reasonSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type NoteInput = z.input<typeof noteSchema>;
