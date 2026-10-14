"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge, type AppointmentStatus } from "@/components/ui/status-badge";

/**
 * A real StatusBadge that changes once, the first time it scrolls into view (e.g. PENDING to APPROVED),
 * the same split-flap flip the lecturer's decision causes in the app. Reduced motion: the badge's own
 * split-flap swaps instantly.
 */
export function FlipOnView({ from, to, delayMs = 700 }: { from: AppointmentStatus; to: AppointmentStatus; delayMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const [status, setStatus] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const id = window.setTimeout(() => setStatus(to), delayMs);
    return () => window.clearTimeout(id);
  }, [inView, to, delayMs]);

  return (
    <span ref={ref} className="inline-flex">
      <StatusBadge status={status} />
    </span>
  );
}
