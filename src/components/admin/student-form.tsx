"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { useToast } from "@/components/ui/toast";
import { clearErrorOnEdit } from "@/lib/form-errors";
import { parseStudentId, STUDENT_ID_EXAMPLE } from "@/lib/student-id";
import { createStudentSchema, updateStudentSchema, type StudentFormInput } from "@/lib/validation/admin";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { createStudentAction, updateStudentAction } from "@/server/actions/admin";
import { TempPasswordField } from "./temp-password-field";

export type StudentFormValues = {
  name: string;
  email: string;
  phoneNo: string;
  studentId: string;
  semester: string;
  faculty: string;
};

/** FR14 add / edit student (UI10, SD11). «include» Insert Student ID uses the KPMB format rule. */
export function StudentForm({
  mode,
  initial,
  idLocked = false,
}: {
  mode: "create" | "edit";
  initial?: StudentFormValues;
  idLocked?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors<StudentFormInput>>({});
  const [message, setMessage] = useState<string>();
  const [parsedId, setParsedId] = useState(() => (initial ? parseStudentId(initial.studentId) : null));
  const v = initial ?? { name: "", email: "", phoneNo: "", studentId: "", semester: "", faculty: "" };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = (mode === "create" ? createStudentSchema : updateStudentSchema).safeParse(Object.fromEntries(data));
    setMessage(undefined);
    if (!parsed.success) {
      // create and edit schemas share every field name; the union just needs telling which type to report
      setErrors(fieldErrors<StudentFormInput>(parsed.error as never));
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await (mode === "create" ? createStudentAction : updateStudentAction)(data);
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      toast({ tone: "success", title: result.message ?? "Saved." });
      router.push(result.redirectTo ?? "/admin/students");
      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} onChange={clearErrorOnEdit(setErrors)} noValidate className="grid gap-5">
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {mode === "edit" && <input type="hidden" name="originalStudentId" value={v.studentId} />}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="student-id"
          label="Student ID"
          required
          error={errors.studentId}
          hint={
            <span aria-live="polite" className={parsedId && !idLocked ? "font-medium text-success" : undefined}>
              {idLocked
                ? "This student has appointments, so the ID can't change."
                : parsedId
                  ? `${parsedId.programme} (${parsedId.id})`
                  : `Example: ${STUDENT_ID_EXAMPLE}. The programme is filled in from the ID.`}
            </span>
          }
        >
          <Input
            name="studentId"
            defaultValue={v.studentId}
            readOnly={idLocked}
            placeholder={STUDENT_ID_EXAMPLE}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            className="font-mono"
            onChange={(e) => {
              const p = parseStudentId(e.target.value);
              setParsedId(p);
              if (p) setErrors((current) => ({ ...current, studentId: undefined }));
            }}
          />
        </Field>
        <Field id="student-name" label="Full name" required error={errors.name}>
          <Input name="name" defaultValue={v.name} autoComplete="off" />
        </Field>
        <Field id="student-email" label="E-mail" required error={errors.email} hint="They log in with this.">
          <Input name="email" type="email" defaultValue={v.email} autoComplete="off" />
        </Field>
        <Field id="student-phone" label="Phone" error={errors.phoneNo}>
          <Input name="phoneNo" type="tel" defaultValue={v.phoneNo} autoComplete="off" />
        </Field>
        <Field id="student-semester" label="Semester" error={errors.semester}>
          <Select name="semester" defaultValue={v.semester}>
            <option value="">Not set</option>
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="student-faculty" label="Faculty" error={errors.faculty} hint="Optional.">
          <Input name="faculty" defaultValue={v.faculty} autoComplete="off" />
        </Field>
        {mode === "create" && (
          <div className="md:col-span-2">
            <TempPasswordField id="student-password" error={errors.password} onValueChange={() => setErrors((e) => ({ ...e, password: undefined }))} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === "create" ? "Add student" : "Save student"}
        </Button>
      </div>
    </form>
  );
}
