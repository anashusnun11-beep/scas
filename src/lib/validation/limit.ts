import { z } from "zod";
import { SESSION_DURATIONS } from "@/lib/limits";

const whole = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be ${max} or less.`);

/** FR13 / SD10: invalid values (0, negative, per day above per week) are rejected with a clear message. */
export const limitSchema = z
  .object({
    maxPerDay: whole("Max per day", 1, 20),
    maxPerWeek: whole("Max per week", 1, 100),
    maxPerStudentWeek: whole("Max per student per week", 1, 20),
    sessionDuration: z.coerce
      .number()
      .refine((v) => (SESSION_DURATIONS as readonly number[]).includes(v), "Choose a session length from the list."),
    minNoticeHours: whole("Minimum notice", 0, 168),
    // Checkbox: present ("on") when ticked, missing when not.
    isEnabled: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  })
  .superRefine((v, ctx) => {
    if (v.maxPerDay > v.maxPerWeek) {
      ctx.addIssue({ code: "custom", path: ["maxPerDay"], message: "Max per day can't be more than max per week." });
    }
    if (v.maxPerStudentWeek > v.maxPerWeek) {
      ctx.addIssue({ code: "custom", path: ["maxPerStudentWeek"], message: "Max per student can't be more than max per week." });
    }
  });

export type LimitInput = z.input<typeof limitSchema>;
