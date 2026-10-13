"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { phoneSchema, type PhoneInput } from "@/lib/validation/profile";
import { updatePhoneAction } from "@/server/actions/profile";

/** Profile: update your own phone number. */
export function PhoneForm({ phoneNo }: { phoneNo: string | null }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<PhoneInput>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = phoneSchema.safeParse(Object.fromEntries(data));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await updatePhoneAction(data);
      if (result.ok) toast({ tone: "success", title: result.message ?? "Saved." });
      else setErrors(result.errors);
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto] sm:items-start">
      <Field id="profile-phone" label="Phone number" error={errors.phoneNo} hint="Your lecturer may call you about an appointment.">
        <Input name="phoneNo" type="tel" inputMode="tel" autoComplete="tel" defaultValue={phoneNo ?? ""} />
      </Field>
      <Button type="submit" loading={pending} className="sm:mt-7">
        Save
      </Button>
    </form>
  );
}
