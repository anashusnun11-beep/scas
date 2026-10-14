"use client";

import { KeyIcon, ProhibitIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/admin";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { deactivateLecturerAction, deactivateStudentAction, reactivateAction, resetPasswordAction } from "@/server/actions/admin";
import { AccountChip } from "./account-chip";
import { TempPasswordField } from "./temp-password-field";

/**
 * Account status and password for one student or lecturer (FR14 / FR15).
 * "Deactivate" is a soft delete (BR8). The dialog says what will happen before it happens.
 */
export function AccountPanel({
  kind,
  userId,
  recordId,
  name,
  status,
  consequence,
  blocked,
}: {
  kind: "student" | "lecturer";
  userId: number;
  recordId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  /** What deactivating does, shown in the dialog (e.g. "2 upcoming appointments will be cancelled"). */
  consequence?: string;
  /** Why deactivating is not possible right now (lecturer with appointments or students). */
  blocked?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"deactivate" | "password" | null>(null);
  const [message, setMessage] = useState<string>();
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordInput>>({});

  function deactivate() {
    startTransition(async () => {
      const result = kind === "student" ? await deactivateStudentAction(recordId) : await deactivateLecturerAction(recordId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setDialog(null);
      toast({ tone: "success", title: result.message ?? "Deactivated." });
      router.refresh();
    });
  }

  function reactivate() {
    startTransition(async () => {
      const result = await reactivateAction(userId);
      toast(result.ok ? { tone: "success", title: result.message ?? "Reactivated." } : { tone: "error", title: "Could not reactivate", description: result.message });
      router.refresh();
    });
  }

  function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(data));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await resetPasswordAction(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      setDialog(null);
      toast({ tone: "success", title: result.message ?? "Password set." });
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">Account</span>
        <AccountChip status={status} />
      </div>
      <p className="text-sm text-muted">
        {status === "ACTIVE"
          ? `${name} can log in.`
          : `${name} can't log in. Their records and history are kept.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" ? (
          <Button
            variant="danger"
            onClick={() => {
              setMessage(undefined);
              setDialog("deactivate");
            }}
          >
            <ProhibitIcon aria-hidden className="size-4" />
            Deactivate
          </Button>
        ) : (
          <Button onClick={reactivate} loading={pending}>
            <ArrowCounterClockwiseIcon aria-hidden className="size-4" />
            Reactivate
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setMessage(undefined);
            setErrors({});
            setDialog("password");
          }}
        >
          <KeyIcon aria-hidden className="size-4" />
          Reset password
        </Button>
      </div>

      {dialog === "deactivate" && (
        <Dialog open onClose={() => setDialog(null)} title={`Deactivate ${name}?`} description="Deactivated accounts can't log in. Nothing is deleted, and you can reactivate later.">
          <div className="grid gap-5">
            {blocked ? (
              <FormMessage tone="error">{blocked}</FormMessage>
            ) : (
              consequence && <FormMessage tone="info">{consequence}</FormMessage>
            )}
            {message && <FormMessage tone="error">{message}</FormMessage>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setDialog(null)} disabled={pending}>
                Keep active
              </Button>
              <Button variant="danger" onClick={deactivate} loading={pending} disabled={Boolean(blocked)}>
                Deactivate
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {dialog === "password" && (
        <Dialog open onClose={() => setDialog(null)} title={`New password for ${name}`} description="Their old password stops working straight away.">
          <form method="post" onSubmit={onReset} noValidate className="grid gap-5">
            {message && <FormMessage tone="error">{message}</FormMessage>}
            <input type="hidden" name="userId" value={userId} />
            <TempPasswordField id={`reset-${userId}`} error={errors.password} label="New temporary password" />
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setDialog(null)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Set password
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
