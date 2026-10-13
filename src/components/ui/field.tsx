import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import { cloneElement, isValidElement, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-control border border-line bg-surface px-3.5 text-base text-ink " +
  "placeholder:text-muted transition-[border-color,box-shadow] duration-150 " +
  "hover:border-line-strong focus-visible:border-focus focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/20 " +
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-(--control-height)", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(control, "resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, "h-(--control-height) appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <CaretDownIcon aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

type ControlProps = {
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Label above, control, then hint and error below (spec NFR06: clear error messages).
 * Wires id, aria-invalid and aria-describedby into the single child control.
 */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactElement<ControlProps>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const controlEl = isValidElement(children)
    ? cloneElement(children, {
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {controlEl}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
