import { z } from "zod";
import { parseTimeOfDay } from "@/lib/slot-time";

/** FR09 slot form. The end time is not an input: the server adds the session duration. */
export const slotSchema = z.object({
  slotId: z.coerce.number().int().positive().optional(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  startTime: z.string().refine((v) => parseTimeOfDay(v) !== null, "Choose a start time."),
  location: z.string().trim().min(2, "Enter where the consultation happens.").max(100, "Location must be 100 characters or fewer."),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"], { error: "Choose a status." }),
});

export type SlotInput = z.infer<typeof slotSchema>;
