import { z } from "zod";
import { studentIdSchema } from "./student-id";

/** FR05 booking form. Shared by the form (client) and submitBookingAction (server). */
export const bookingSchema = z.object({
  slotId: z.coerce.number({ error: "Choose a time slot." }).int("Choose a time slot.").positive("Choose a time slot."),
  // «include» Insert Student ID: checked against the signed-in student on the server (SD3 step 11).
  studentId: studentIdSchema,
  purpose: z
    .string()
    .trim()
    .min(10, "Tell your lecturer what the consultation is about (at least 10 characters).")
    .max(500, "Keep the purpose under 500 characters."),
});

export type BookingInput = z.infer<typeof bookingSchema>;
