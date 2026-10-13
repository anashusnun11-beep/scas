"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/guard";
import { bookingSchema, type BookingInput } from "@/lib/validation/booking";
import { fieldErrors } from "@/lib/validation/auth";
import { BookingError, submitBooking } from "@/server/services/booking";

/** FR05 Book Appointment (student). */
export async function submitBookingAction(formData: FormData): Promise<ActionResult<BookingInput>> {
  const user = await requireRole("STUDENT");

  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    const appointment = await submitBooking({
      userId: user.id,
      studentIdInput: parsed.data.studentId,
      slotId: parsed.data.slotId,
      purpose: parsed.data.purpose,
    });
    return { ok: true, redirectTo: `/student/appointments/${appointment.id}?booked=1` };
  } catch (error) {
    if (error instanceof BookingError) {
      return error.field
        ? { ok: false, errors: { [error.field]: error.message } }
        : { ok: false, errors: {}, message: error.message };
    }
    throw error;
  }
}
