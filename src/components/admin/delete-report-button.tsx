"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { deleteReportAction } from "@/server/actions/report";

/** Delete a saved report, after a confirmation that says nothing else is touched (decision 2026-10-23). */
export function DeleteReportButton({ reportId, code }: { reportId: number; code: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();

  function remove() {
    startTransition(async () => {
      const result = await deleteReportAction(reportId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setOpen(false);
      toast({ tone: "success", title: result.message });
      router.replace("/admin/reports");
    });
  }

  return (
    <>
      <Button
        variant="danger"
        className="print:hidden"
        onClick={() => {
          setMessage(undefined);
          setOpen(true);
        }}
      >
        <TrashIcon aria-hidden className="size-4" />
        Delete report
      </Button>
      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          title={`Delete ${code}?`}
          description="It is removed from Past reports. Appointments and other data are not changed, and you can generate the same report again at any time."
        >
          <div className="grid gap-5">
            {message && <FormMessage tone="error">{message}</FormMessage>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Keep report
              </Button>
              <Button variant="danger" onClick={remove} loading={pending}>
                Delete report
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
