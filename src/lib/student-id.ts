/**
 * KPMB student ID: <PROGRAMME CODE><YY><INTAKE>-<NNN>, e.g. BCS2403-019
 *   BCS 24 03 - 019  =  Diploma in Computer Science, 2024 intake, intake 03, number 019
 * Used by sign up (FR01) and by the admin student form (FR14), so both validate the same way.
 */

export const PROGRAMMES = {
  BCS: { name: "Diploma in Computer Science", short: "DCS" },
  BDA: { name: "Diploma in Accounting", short: "DIA" },
  BDB: { name: "Diploma in Business Studies", short: "DBS" },
  BLH: { name: "Diploma in Landscaping", short: "DLH" },
} as const;

export type ProgrammeCode = keyof typeof PROGRAMMES;

/** Uppercase form only; normalise input with `normalizeStudentId` first. */
export const STUDENT_ID_PATTERN = /^(BCS|BDA|BDB|BLH)(\d{2})(0[1-3])-(\d{3})$/;

export const STUDENT_ID_EXAMPLE = "BCS2403-019";

export function normalizeStudentId(input: string) {
  return input.trim().toUpperCase();
}

export type ParsedStudentId = {
  id: string;
  code: ProgrammeCode;
  programme: string;
  intakeYear: number;
  intake: number;
  sequence: number;
};

/** Parses an ID (any case, surrounding spaces allowed). Returns null if the format is wrong. */
export function parseStudentId(input: string): ParsedStudentId | null {
  const id = normalizeStudentId(input);
  const match = STUDENT_ID_PATTERN.exec(id);
  if (!match) return null;
  const [, code, yy, intake, nnn] = match;
  const sequence = Number(nnn);
  if (sequence < 1) return null; // 001 to 999
  const programmeCode = code as ProgrammeCode;
  return {
    id,
    code: programmeCode,
    programme: PROGRAMMES[programmeCode].name,
    intakeYear: 2000 + Number(yy),
    intake: Number(intake),
    sequence,
  };
}
