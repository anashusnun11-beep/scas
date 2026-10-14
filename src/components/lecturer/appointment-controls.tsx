"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AppointmentStatus } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { approveAction, cancelAction, rejectAction } from "@/server/actions/lecturer-appointment";
import { lecturerAppointmentPath, type SlotChoice } from "./items";
import { ReasonDialog } from "./reason-dialog";
import { FLIP_HOLD_MS } from "./request-list";
import { RescheduleDialog } from "./reschedule-dialog";

type Kind = "reject" | "cancel" | "reschedule" | null;

/**
 * Status + actions on one appointment's page. After a change the badge flips to the new status,
 * holds, then the page moves to where that status lives (requests, appointments or history).
 */
export function AppointmentControls({
  id,
  code,
  status: initialStatus,
  started,
  current,
  studentName,
  slotChoices,
}: {
  id: number;
  code: string;
  status: AppointmentStatus;
  started: boolean;
  current: string;
  studentName: string;
  slotChoices: SlotChoice[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [settled, setSettled] = useState(false);
  const [dialog, setDialog] = useState<Kind>(null);
  const [pending, startTransition] = useTransition();

  function settle(next: AppointmentStatus, message?: string) {
    setStatus(next);
    setSettled(true);
    setDialog(null);
    toast({ tone: "success", title: message ?? "Saved." });
    window.setTimeout(() => {
      const target = lecturerAppointmentPath(next, id);
      if (target === lecturerAppointmentPath(initialStatus, id)) router.refresh();
      else router.replace(target);
    }, FLIP_HOLD_MS);
  }

  const isPending = status === "PENDING";
  const isActive = status === "APPROVED" || status === "RESCHEDULED";

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">Status</span>
        <StatusBadge status={status} />
      </div>

      {!settled && (isPending || isActive) && (
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <>
              <Button
                onClick={() =>
                  startTransition(async () => {
                    const result = await approveAction(id);
                    if (result.ok) settle("APPROVED", result.message);
                    else toast({ tone: "error", title: "Could not approve", description: result.message });
                  })
                }
                loading={pending}
                disabled={started}
              >
                Approve
              </Button>
              <Button variant="danger" onClick={() => setDialog("reject")} disabled={pending}>
                Reject
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setDialog("reschedule")} disabled={pending}>
            Reschedule
          </Button>
          {isActive && (
            <Button variant="danger" onClick={() => setDialog("cancel")} disabled={pending}>
              Cancel appointment
            </Button>
          )}
        </div>
      )}
      {isPending && started && !settled && <p className="text-sm text-danger">This slot has passed, so it can only be rejected.</p>}

      {dialog === "reject" && (
        <ReasonDialog
          open
          onClose={() => setDialog(null)}
          appointmentId={id}
          title={`Reject ${code}?`}
          description={`${studentName}, ${current}. The slot opens up again for other students.`}
          confirmLabel="Reject request"
          placeholder="e.g. I am at a faculty meeting at this time. Please book a slot next week."
          action={rejectAction}
          onDone={(message) => settle("REJECTED", message)}
        />
      )}
      {dialog === "cancel" && (
        <ReasonDialog
          open
          onClose={() => setDialog(null)}
          appointmentId={id}
          title={`Cancel ${code}?`}
          description={`${studentName}, ${current}. The slot opens up again for other students.`}
          confirmLabel="Cancel appointment"
          placeholder="e.g. I have to attend an urgent meeting. Please book another slot."
          action={cancelAction}
          onDone={(message) => settle("CANCELLED", message)}
        />
      )}
      {dialog === "reschedule" && (
        <RescheduleDialog
          open
          onClose={() => setDialog(null)}
          appointmentId={id}
          current={current}
          options={slotChoices}
          onDone={(message) => settle("RESCHEDULED", message)}
        />
      )}
    </div>
  );
}
