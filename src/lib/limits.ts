/** Consultation limitation defaults (decision log, from UI9). Used when a lecturer has not saved any settings yet (SD10 alt). */
export const DEFAULT_LIMIT = {
  maxPerDay: 6,
  maxPerWeek: 20,
  maxPerStudentWeek: 2,
  sessionDuration: 30,
  minNoticeHours: 24,
  isEnabled: true,
} as const;

export type LimitSettings = {
  maxPerDay: number;
  maxPerWeek: number;
  maxPerStudentWeek: number;
  sessionDuration: number;
  minNoticeHours: number;
  isEnabled: boolean;
};

/** Session lengths a lecturer can pick (minutes). */
export const SESSION_DURATIONS = [15, 20, 30, 45, 60, 90, 120] as const;
