import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { FieldErrors } from "@/lib/validation/auth";

/**
 * `<form onChange={clearErrorOnEdit(setErrors)}>`: as soon as someone edits a field, its old error
 * goes away, so a corrected field never sits next to a stale red message. The rest stay until submit.
 */
export function clearErrorOnEdit<T>(setErrors: Dispatch<SetStateAction<FieldErrors<T>>>) {
  return (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name as keyof T | "";
    if (!name) return;
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };
}
