/**
 * KPMB student ID: <PROGRAMME CODE><7 DIGITS>, with an optional "-" before the last 3 digits.
 *   BCS2403-019 and BCS2403019 are the same ID; it is always stored as BCS2403-019.
 * Used by sign up (FR01), booking (FR05) and the admin student form (FR14), so all validate the same way.
 */

export const PROGRAMMES = {
  BCS: { name: "Diploma in Computer Science", short: "DCS" },
  BDA: { name: "Diploma in Accounting", short: "DIA" },
  BDB: { name: "Diploma in Business Studies", short: "DBS" },
  BLH: { name: "Diploma in Landscaping", short: "DLH" },
  CFAB: { name: "ICAEW Certificate in Finance, Accounting and Business", short: "CFAB" },
} as const;

export type ProgrammeCode = keyof typeof PROGRAMMES;

/** Uppercase input; the dash before the last 3 digits is optional. */
export const STUDENT_ID_PATTERN = /^(BCS|BDA|BDB|BLH|CFAB)(\d{4})-?(\d{3})$/;

export const STUDENT_ID_EXAMPLE = "BCS2403-019";

/** Uppercase, trimmed, and with the dash in place, so one ID is stored and compared in one form only. */
export function normalizeStudentId(input: string) {
  const id = input.trim().toUpperCase();
  const match = STUDENT_ID_PATTERN.exec(id);
  return match ? `${match[1]}${match[2]}-${match[3]}` : id;
}

export type ParsedStudentId = {
  id: string;
  code: ProgrammeCode;
  programme: string;
};

/** Parses an ID (any case, surrounding spaces, with or without the dash). Returns null if the format is wrong. */
export function parseStudentId(input: string): ParsedStudentId | null {
  const match = STUDENT_ID_PATTERN.exec(input.trim().toUpperCase());
  if (!match) return null;
  const code = match[1] as ProgrammeCode;
  return { id: `${code}${match[2]}-${match[3]}`, code, programme: PROGRAMMES[code].name };
}
