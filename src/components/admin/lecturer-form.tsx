"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { createLecturerSchema, updateLecturerSchema, type LecturerFormInput } from "@/lib/validation/admin";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { createLecturerAction, updateLecturerAction } from "@/server/actions/admin";
import { TempPasswordField } from "./temp-password-field";

export type LecturerFormValues = {
  name: string;
  email: string;
  phoneNo: string;
  lecturerId: string;
  department: string;
  officeRoom: string;
  position: string;
};

/** FR15 add / edit lecturer (SD12). «include» Insert Lecturer ID. */
export function LecturerForm({ mode, initial, idLocked = false }: { mode: "create" | "edit"; initial?: LecturerFormValues; idLocked?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<LecturerFormInput>>({});
  const [message, setMessage] = useState<string>();
  const v = initial ?? { name: "", email: "", phoneNo: "", lecturerId: "", department: "", officeRoom: "", position: "" };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = (mode === "create" ? createLecturerSchema : updateLecturerSchema).safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      setErrors(fieldErrors<LecturerFormInput>(parsed.error as never));
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await (mode === "create" ? createLecturerAction : updateLecturerAction)(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      toast({ tone: "success", title: result.message ?? "Saved." });
      router.push(result.redirectTo ?? "/admin/lecturers");
      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {mode === "edit" && <input type="hidden" name="originalLecturerId" value={v.lecturerId} />}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="lecturer-id"
          label="Lecturer ID"
          required
          error={errors.lecturerId}
          hint={idLocked ? "This lecturer has appointments, so the ID can't change." : "Staff ID, 3 to 20 letters or digits, e.g. LEC001."}
        >
          <Input
            name="lecturerId"
            defaultValue={v.lecturerId}
            readOnly={idLocked}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            className="font-mono"
          />
        </Field>
        <Field id="lecturer-name" label="Full name" required error={errors.name} hint="With title, e.g. Dr. or En.">
          <Input name="name" defaultValue={v.name} autoComplete="off" />
        </Field>
        <Field id="lecturer-email" label="E-mail" required error={errors.email} hint="They log in with this. Students see it.">
          <Input name="email" type="email" defaultValue={v.email} autoComplete="off" />
        </Field>
        <Field id="lecturer-phone" label="Phone" error={errors.phoneNo} hint="Students see it.">
          <Input name="phoneNo" type="tel" defaultValue={v.phoneNo} autoComplete="off" />
        </Field>
        <Field id="lecturer-department" label="Department" required error={errors.department}>
          <Input name="department" defaultValue={v.department} autoComplete="off" />
        </Field>
        <Field id="lecturer-office" label="Office room" required error={errors.officeRoom} hint="e.g. Block B, Level 2, Room 2.14">
          <Input name="officeRoom" defaultValue={v.officeRoom} autoComplete="off" />
        </Field>
        <Field id="lecturer-position" label="Position" error={errors.position} hint="Optional, e.g. Senior Lecturer.">
          <Input name="position" defaultValue={v.position} autoComplete="off" />
        </Field>
        {mode === "create" && (
          <div className="md:col-span-2">
            <TempPasswordField id="lecturer-password" error={errors.password} onValueChange={() => setErrors((e) => ({ ...e, password: undefined }))} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === "create" ? "Add lecturer" : "Save lecturer"}
        </Button>
      </div>
    </form>
  );
}
