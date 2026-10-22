import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Use a card only when it groups something the user acts on; otherwise use spacing. */
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("min-w-0 rounded-card border border-line bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h2 className="[overflow-wrap:anywhere] font-display text-heading font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 [overflow-wrap:anywhere] text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4", className)} {...props} />;
}
