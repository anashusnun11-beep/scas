"use client";

import { CopyIcon, EyeIcon, EyeSlashIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

// No look-alike characters (0/O, 1/l/I), so it is easy to read out or write down.
const LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

/** 12 characters from the browser's CSPRNG, always with a letter and a digit (meets the password rule). */
export function generatePassword(length = 12) {
  const all = LETTERS + DIGITS;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(LETTERS), pick(DIGITS), ...Array.from({ length: length - 2 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/** Temporary password for an admin-created account: type one or generate one, then copy it for the user. */
export function TempPasswordField({
  id,
  error,
  label = "Temporary password",
  onValueChange,
}: {
  id: string;
  error?: string;
  label?: string;
  /** Called when the value changes, including Generate (which sets it from code, so the form's onChange never fires). */
  onValueChange?: () => void;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label} required error={error} hint="8 or more characters with a letter and a number. Give it to the user in person.">
      <TempPasswordInput
        value={value}
        visible={visible}
        onChange={(v) => {
          setValue(v);
          onValueChange?.();
        }}
        onToggle={() => setVisible(!visible)}
        onGenerate={() => {
          setValue(generatePassword());
          setVisible(true);
          onValueChange?.();
        }}
        onCopy={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast({ tone: "success", title: "Password copied" });
          } catch {
            toast({ tone: "info", title: "Copy it by hand", description: "The browser blocked the clipboard." });
          }
        }}
      />
    </Field>
  );
}

/** The input row. Receives id / aria props from <Field> and passes them to the input. */
function TempPasswordInput({
  value,
  visible,
  onChange,
  onToggle,
  onGenerate,
  onCopy,
  ...aria
}: {
  value: string;
  visible: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
  onGenerate: () => void;
  onCopy: () => void;
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <Input
          {...aria}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12 font-mono"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-muted hover:text-ink"
        >
          {visible ? <EyeSlashIcon aria-hidden className="size-5" /> : <EyeIcon aria-hidden className="size-5" />}
        </button>
      </div>
      <Button variant="secondary" onClick={onGenerate}>
        <SparkleIcon aria-hidden className="size-4" />
        Generate
      </Button>
      <Button variant="ghost" onClick={onCopy} disabled={!value} aria-label="Copy password">
        <CopyIcon aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
