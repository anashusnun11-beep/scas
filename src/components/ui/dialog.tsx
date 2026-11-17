"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal dialog on the native <dialog> element: the browser traps focus, Escape closes it and
 * focus returns to the button that opened it. Entrance is a short CSS animation.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault(); // Escape: let the parent decide (it owns `open`)
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className={cn(
        "scas-dialog m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-(--scrim)",
        className,
      )}
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="[overflow-wrap:anywhere] font-display text-heading font-semibold">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1 [overflow-wrap:anywhere] text-sm text-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-2 grid size-10 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2 hover:text-ink"
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
