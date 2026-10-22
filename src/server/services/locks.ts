import type { Prisma } from "@/generated/prisma/client";

/**
 * Serialises every change to one lecturer's slots and appointments: student bookings (FR05),
 * approve / reject / reschedule / cancel (FR10, FR11), notes (FR12) and slot edits (FR09).
 * Transaction-scoped: released automatically on commit or rollback.
 *
 * $executeRaw, not $queryRaw: pg_advisory_xact_lock returns void, which $queryRaw cannot deserialize.
 */
export async function lockLecturer(tx: Prisma.TransactionClient, lecturerId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${lecturerId}`}))`;
}

/**
 * Serialises one student's bookings across lecturers, so two bookings at the same time with different
 * lecturers can't both pass the clash check (decision 2026-10-23). Always take it BEFORE lockLecturer,
 * in every transaction that takes both, so two transactions never wait on each other in a circle.
 */
export async function lockStudent(tx: Prisma.TransactionClient, studentId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`student:${studentId}`}))`;
}

/**
 * Options for every transaction that takes the lecturer lock. Bookings for one lecturer queue on the
 * lock, so allow time to get a connection (maxWait) and to finish behind others (timeout).
 * Prisma's defaults (2 s / 5 s) were too tight against the hosted database under concurrent bookings.
 */
export const LOCKED_TX = { maxWait: 10_000, timeout: 15_000 } as const;
