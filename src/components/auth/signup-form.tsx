"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { fieldErrors, signupSchema, type FieldErrors, type SignupInput } from "@/lib/validation/auth";
import { signUpAction } from "@/server/actions/auth";
import { FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";

/** FR01: students register themselves. Lecturers and admins are created by the admin. */
export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<SignupInput>>({});
  const [message, setMessage] = useState<string>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = signupSchema.safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await signUpAction(data);
      if (result.ok) {
        router.push(result.redirectTo);
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {message && <FormMessage tone="error">{message}</FormMessage>}

      <Field id="signup-name" label="Full name" required error={errors.name}>
        <Input name="name" autoComplete="name" />
      </Field>
      <Field id="signup-email" label="E-mail" required error={errors.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" />
      </Field>
      <Field id="signup-student-id" label="Student ID" required error={errors.studentId} hint="Letters and digits only, as on your matric card.">
        <Input name="studentId" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="signup-password" label="Password" required error={errors.password} hint="8 or more characters, with a letter and a number.">
          <PasswordInput name="password" autoComplete="new-password" />
        </Field>
        <Field id="signup-confirm" label="Confirm password" required error={errors.confirmPassword}>
          <PasswordInput name="confirmPassword" autoComplete="new-password" />
        </Field>
      </div>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? "Creating account" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">Lecturer or admin? Your account is created by the admin office.</p>
    </form>
  );
}
