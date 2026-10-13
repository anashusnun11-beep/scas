import { CircleNotchIcon } from "@phosphor-icons/react/ssr";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold select-none " +
  "transition-[background-color,border-color,color,transform] duration-150 ease-out-soft " +
  "active:scale-[0.97] motion-reduce:active:scale-100 " +
  "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-on-danger hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-(--control-height) px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/** Class string for anything that should look like a button (e.g. a Next <Link>). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the label (so the width doesn't jump) and blocks clicks. */
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <CircleNotchIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" weight="bold" />}
      {children}
    </button>
  );
}
