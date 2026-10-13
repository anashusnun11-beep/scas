"use client";

import { useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { useDoor } from "@/components/stage/door-context";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { fieldErrors, loginSchema, type FieldErrors, type LoginInput } from "@/lib/validation/auth";
import { loginAction } from "@/server/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { PasswordInput } from "./password-input";

// How long the door gets to open before we leave the page. Short on purpose: the form stays fast.
const DOOR_BEAT_MS = 650;

export type LoginNotice = { tone: "success" | "info"; text: string };

/** FR02. Client-side Zod check first (instant feedback), then the server action re-checks everything. */
export function LoginForm({ callbackUrl, notice }: { callbackUrl?: string; notice?: LoginNotice }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { openDoor } = useDoor();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [message, setMessage] = useState<string>();
  const [entering, setEntering] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = loginSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await loginAction(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      // Knock answered: the sign flips to MASUK, the door opens, then into the dashboard.
      setEntering(true);
      openDoor();
      window.setTimeout(() => router.replace(result.redirectTo ?? "/dashboard"), reduce ? 0 : DOOR_BEAT_MS);
    });
  }

  const busy = pending || entering;

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="grid gap-5">
      {message ? (
        <FormMessage tone="error">{message}</FormMessage>
      ) : notice ? (
        <FormMessage tone={notice.tone}>{notice.text}</FormMessage>
      ) : null}

      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      <Field id="login-email" label="E-mail" required error={errors.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" disabled={entering} />
      </Field>
      <Field id="login-password" label="Password" required error={errors.password}>
        <PasswordInput name="password" autoComplete="current-password" disabled={entering} />
      </Field>

      <Button type="submit" size="lg" loading={busy} className="w-full">
        {entering ? "Opening the door" : pending ? "Checking" : "Log in"}
      </Button>
    </form>
  );
}
