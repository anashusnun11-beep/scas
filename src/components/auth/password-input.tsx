"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/field";

/** Password input with a show/hide button. Receives id and aria props from <Field>. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-muted hover:text-ink"
      >
        {visible ? <EyeSlashIcon aria-hidden className="size-5" /> : <EyeIcon aria-hidden className="size-5" />}
      </button>
    </div>
  );
}
