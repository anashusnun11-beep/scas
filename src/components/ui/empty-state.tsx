import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Says what is missing and what to do next. */
export function EmptyState({
  icon: IconComponent,
  title,
  children,
  action,
  className,
}: {
  icon?: Icon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid justify-items-center gap-3 rounded-card border border-dashed border-line-strong px-6 py-10 text-center", className)}>
      {IconComponent && (
        <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
          <IconComponent aria-hidden className="size-6" />
        </span>
      )}
      <p className="font-display text-subheading font-semibold">{title}</p>
      {children && <div className="max-w-[48ch] text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
