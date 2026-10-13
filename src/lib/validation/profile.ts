import { z } from "zod";

/** Malaysian-style phone number, e.g. 012-345 6789 or +6012 345 6789. Empty clears it. Fits users.phone_no VARCHAR(15). */
export const phoneSchema = z.object({
  phoneNo: z
    .string()
    .trim()
    .max(15, "Phone number must be 15 characters or fewer.")
    .refine((v) => v === "" || /^\+?\d[\d -]{7,13}\d$/.test(v), "Enter a phone number like 012-345 6789."),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
