"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { transition } from "@/lib/motion";

/**
 * Dashboard counter: renders the real number on the server (visible without JS, no layout shift),
 * then counts up from 0 once on first view. Reduced motion: stays static.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce || value === 0) return;
    const controls = animate(0, value, {
      ...transition.counter,
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
