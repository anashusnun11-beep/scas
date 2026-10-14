import { DEFAULT_LIMIT } from "@/lib/limits";
import { formatSlotDate, slotStartsAt } from "@/lib/dates";
import { endFor, formatMinutes, minutesOf, overlaps, parseTimeOfDay, timeFromMinutes } from "@/lib/slot-time";
import type { SlotInput } from "@/lib/validation/slot";
import { prisma } from "@/server/db";
import { LOCKED_TX, lockLecturer } from "./locks";

export type SlotErrorCode = "not-found" | "booked" | "has-history" | "past" | "overlap" | "past-midnight";

export class SlotError extends Error {
  constructor(
    readonly code: SlotErrorCode,
    message: string,
    readonly field?: keyof SlotInput,
  ) {
    super(message);
  }
}

/**
 * SlotController.saveSlot (FR09, SD6). Add or edit one slot.
 * - end time = start + the lecturer's session duration (decision log)
 * - no slots in the past, no overlap with any of the lecturer's slots (any status)
 * - BOOKED slots are locked; slots with appointment history only change status (decision 2026-10-14)
 */
export async function saveSlot(lecturerId: string, input: SlotInput, now = new Date()) {
  const limit = (await prisma.consultationLimit.findUnique({ where: { lecturerId } })) ?? DEFAULT_LIMIT;
  const start = parseTimeOfDay(input.startTime)!;
  const end = endFor(start, limit.sessionDuration);
  if (end === null) {
    throw new SlotError("past-midnight", `A ${limit.sessionDuration}-minute slot starting at ${input.startTime} would end after midnight.`, "startTime");
  }
  const slotDate = new Date(`${input.slotDate}T00:00:00Z`);
  if (slotStartsAt(slotDate, timeFromMinutes(start)) <= now) {
    throw new SlotError("past", "That time has already passed. Choose a time in the future.", "startTime");
  }

  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);

    if (input.slotId) {
      const existing = await tx.availabilitySlot.findFirst({ where: { id: input.slotId, lecturerId } });
      if (!existing) throw new SlotError("not-found", "That slot no longer exists.");
      if (existing.slotStatus === "BOOKED") {
        throw new SlotError("booked", "This slot is booked. Reschedule or cancel the appointment first.");
      }
      const history = await tx.appointment.count({ where: { slotId: existing.id } });
      const moved =
        existing.slotDate.getTime() !== slotDate.getTime() || minutesOf(existing.startTime) !== start || existing.location !== input.location;
      if (history > 0 && moved) {
        throw new SlotError(
          "has-history",
          "This slot has past appointments, so its date, time and location stay as they are. You can still make it available or unavailable.",
        );
      }
    }

    const sameDay = await tx.availabilitySlot.findMany({
      where: { lecturerId, slotDate, ...(input.slotId ? { id: { not: input.slotId } } : {}) },
      select: { startTime: true, endTime: true },
    });
    const clash = sameDay.find((s) => overlaps({ start, end }, { start: minutesOf(s.startTime), end: minutesOf(s.endTime) }));
    if (clash) {
      throw new SlotError(
        "overlap",
        `This overlaps your ${formatMinutes(minutesOf(clash.startTime))} - ${formatMinutes(minutesOf(clash.endTime))} slot on ${formatSlotDate(slotDate)}.`,
        "startTime",
      );
    }

    const data = {
      slotDate,
      startTime: timeFromMinutes(start),
      endTime: timeFromMinutes(end),
      location: input.location,
      slotStatus: input.status,
    };
    return input.slotId
      ? tx.availabilitySlot.update({ where: { id: input.slotId }, data, select: { id: true } })
      : tx.availabilitySlot.create({ data: { ...data, lecturerId }, select: { id: true } });
  }, LOCKED_TX);
}

/** Remove a slot that was never booked. Booked slots are locked; slots with history can only be made unavailable. */
export async function deleteSlot(lecturerId: string, slotId: number) {
  return prisma.$transaction(async (tx) => {
    await lockLecturer(tx, lecturerId);
    const existing = await tx.availabilitySlot.findFirst({ where: { id: slotId, lecturerId } });
    if (!existing) throw new SlotError("not-found", "That slot no longer exists.");
    if (existing.slotStatus === "BOOKED") {
      throw new SlotError("booked", "This slot is booked. Reschedule or cancel the appointment first.");
    }
    if ((await tx.appointment.count({ where: { slotId } })) > 0) {
      throw new SlotError("has-history", "This slot has past appointments, so it can't be deleted. Make it unavailable instead.");
    }
    await tx.availabilitySlot.delete({ where: { id: slotId } });
  }, LOCKED_TX);
}
