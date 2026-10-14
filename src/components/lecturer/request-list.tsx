"use client";

import { CheckIcon, ClockCountdownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AppointmentStatus } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { approveAction, rejectAction } from "@/server/actions/lecturer-appointment";
import { lecturerAppointmentPath, type AppointmentItem, type SlotChoice } from "./items";
import { ReasonDialog } from "./reason-dialog";
import { RescheduleDialog } from "./reschedule-dialog";

/** How long the new status stays on screen (after the split-flap) before the row leaves the list. */
export const FLIP_HOLD_MS = 1100;

type Dialog = { kind: "reject" | "reschedule"; item: AppointmentItem } | null;

/** FR10 Booking Requests (UI6, SD7): approve, reject with a reason, or reschedule each pending request. */
export function RequestList({ items, slotChoices }: { items: AppointmentItem[]; slotChoices: SlotChoice[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<number>();
  const [, startTransition] = useTransition();
  const [resolved, setResolved] = useState<Record<number, AppointmentStatus>>({});
  const [dialog, setDialog] = useState<Dialog>(null);

  /** The badge flips to the new word, holds for a moment, then the list reloads without that row. */
  function settle(id: number, status: AppointmentStatus, message?: string) {
    setResolved((r) => ({ ...r, [id]: status }));
    toast({ tone: "success", title: message ?? "Saved." });
    window.setTimeout(() => router.refresh(), FLIP_HOLD_MS);
  }

  function approve(item: AppointmentItem) {
    setBusyId(item.id);
    startTransition(async () => {
      const result = await approveAction(item.id);
      setBusyId(undefined);
      if (result.ok) settle(item.id, "APPROVED", `${item.code} approved for ${item.studentName}.`);
      else toast({ tone: "error", title: "Could not approve", description: result.message });
    });
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const status = resolved[item.id] ?? item.status;
          const done = Boolean(resolved[item.id]);
          return (
            <li key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={lecturerAppointmentPath(status, item.id)} className="truncate font-semibold hover:underline">
                    {item.studentName}
                  </Link>
                  <span className="font-mono text-xs text-muted">{item.studentId}</span>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-1 font-mono text-sm">
                  {item.dayLabel}, {item.timeLabel} <span className="font-sans text-muted">{item.location}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{item.purpose}</p>
                {item.started && !done && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                    <ClockCountdownIcon aria-hidden className="size-4" />
                    This slot has passed. It can only be rejected.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {done ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    <CheckIcon aria-hidden className="size-4" /> Done
                  </span>
                ) : (
                  <>
                    <Button size="sm" onClick={() => approve(item)} loading={busyId === item.id} disabled={item.started || busyId !== undefined}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDialog({ kind: "reject", item })} disabled={busyId !== undefined}>
                      Reject
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "reschedule", item })} disabled={busyId !== undefined}>
                      Reschedule
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {dialog?.kind === "reject" && (
        <ReasonDialog
          open
          onClose={() => setDialog(null)}
          appointmentId={dialog.item.id}
          title={`Reject ${dialog.item.code}?`}
          description={`${dialog.item.studentName}, ${dialog.item.dayLabel} ${dialog.item.timeLabel}. The slot opens up again for other students.`}
          confirmLabel="Reject request"
          placeholder="e.g. I am at a faculty meeting at this time. Please book a slot next week."
          action={rejectAction}
          onDone={(message) => {
            const id = dialog.item.id;
            setDialog(null);
            settle(id, "REJECTED", message);
          }}
        />
      )}
      {dialog?.kind === "reschedule" && (
        <RescheduleDialog
          open
          onClose={() => setDialog(null)}
          appointmentId={dialog.item.id}
          current={`${dialog.item.dayLabel}, ${dialog.item.timeLabel}`}
          options={slotChoices}
          onDone={(message) => {
            const id = dialog.item.id;
            setDialog(null);
            settle(id, "RESCHEDULED", message);
          }}
        />
      )}
    </>
  );
}
