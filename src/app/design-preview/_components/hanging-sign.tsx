"use client";

import { motion, type Transition } from "motion/react";

/** Two-sided door sign: red SILA KETUK on the front, green SILA MASUK on the back. */
export function HangingSign({
  flipped,
  transition,
  className = "",
}: {
  flipped: boolean;
  transition: Transition;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`} style={{ perspective: 600 }}>
      {/* the cord */}
      <svg width="64" height="18" viewBox="0 0 64 18" aria-hidden className="text-(--ink) opacity-50">
        <path d="M6 18 L32 2 L58 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <motion.div
        className="preserve-3d relative h-9 w-28"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={transition}
        role="img"
        aria-label={flipped ? "Sign: Sila masuk (please come in)" : "Sign: Sila ketuk (please knock)"}
      >
        <span className="backface-hidden absolute inset-0 grid place-items-center rounded-[6px] bg-(--sign-stop) text-[11px] font-bold tracking-[0.12em] text-white">
          SILA KETUK
        </span>
        <span
          className="backface-hidden absolute inset-0 grid place-items-center rounded-[6px] bg-(--sign-go) text-[11px] font-bold tracking-[0.12em] text-white"
          style={{ transform: "rotateY(180deg)" }}
        >
          SILA MASUK
        </span>
      </motion.div>
    </div>
  );
}
