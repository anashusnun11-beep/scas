import { z } from "zod";
import { parseDateInput } from "@/lib/reports";
import { parseTimeOfDay } from "@/lib/slot-time";

/** FR09 slot form. The end time is not an input: the server adds the session duration. */
export const slotSchema = z.object({
  slotId: z.coerce.number().int().positive().optional(),
  // A real calendar date: "2026-11-31" would otherwise roll over to 1 December.
  slotDate: z.string().refine((v) => parseDateInput(v) !== null, "Choose a valid date."),
  startTime: z.string().refine((v) => parseTimeOfDay(v) !== null, "Choose a start time."),
  location: z.string().trim().min(2, "Enter where the consultation happens.").max(100, "Location must be 100 characters or fewer."),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"], { error: "Choose a status." }),
});

export type SlotInput = z.infer<typeof slotSchema>;
