"use client";

import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { variants } from "@/lib/motion";

export type ToastTone = "success" | "error" | "info";

type ToastInput = { title: string; description?: string; tone?: ToastTone };
type ToastItem = Required<Pick<ToastInput, "title" | "tone">> & { id: number; description?: string };

type ToastApi = { toast: (input: ToastInput) => number; dismiss: (id: number) => void };

const ToastContext = createContext<ToastApi | null>(null);

// Errors stay longer: people need time to read what went wrong.
const LIFETIME: Record<ToastTone, number> = { success: 4000, info: 5000, error: 8000 };

const toneStyle: Record<ToastTone, { icon: typeof InfoIcon; className: string }> = {
  success: { icon: CheckCircleIcon, className: "text-success" },
  error: { icon: WarningCircleIcon, className: "text-danger" },
  info: { icon: InfoIcon, className: "text-accent-ink" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info" }: ToastInput) => {
      const id = nextId.current++;
      // Keep at most 3 on screen; the oldest goes first.
      setItems((list) => [...list.slice(-2), { id, title, description, tone }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), LIFETIME[tone]));
      return id;
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-(--z-toast) flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96 print:hidden"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const { icon: Icon, className } = toneStyle[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                {...variants.toast}
                role={item.tone === "error" ? "alert" : "status"}
                className="pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-ink shadow-float"
              >
                <Icon aria-hidden weight="fill" className={cn("mt-0.5 size-5 shrink-0", className)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 grid size-8 shrink-0 place-items-center rounded-chip text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <XIcon aria-hidden className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** `const { toast } = useToast(); toast({ tone: "success", title: "Booking submitted" })` */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
