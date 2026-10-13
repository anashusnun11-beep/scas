"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/guard";
import { fieldErrors } from "@/lib/validation/auth";
import { phoneSchema, type PhoneInput } from "@/lib/validation/profile";
import { prisma } from "@/server/db";

/** Profile: users can update their own phone number (User.updateProfile in the class diagram). */
export async function updatePhoneAction(formData: FormData): Promise<ActionResult<PhoneInput>> {
  const user = await requireRole("STUDENT", "LECTURER", "ADMIN");
  const parsed = phoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await prisma.user.update({ where: { id: user.id }, data: { phoneNo: parsed.data.phoneNo || null } });
  return { ok: true, message: parsed.data.phoneNo ? "Phone number saved." : "Phone number removed." };
}
