import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  error: { icon: WarningCircleIcon, className: "border-danger/40 text-danger", role: "alert" as const },
  success: { icon: CheckCircleIcon, className: "border-success/40 text-success", role: "status" as const },
  info: { icon: InfoIcon, className: "border-line text-accent-ink", role: "status" as const },
};

/** A message about the whole form (not one field), shown above the fields. */
export function FormMessage({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  const { icon: Icon, className, role } = tones[tone];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-control border bg-surface px-4 py-3", className)}>
      <Icon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      <p className="text-sm font-medium text-ink">{children}</p>
    </div>
  );
}
