"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { splitFlap, type SplitFlapSpeed } from "@/lib/motion";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Frame = { chars: string[]; flipping: boolean[] };

/**
 * Split-flap text, borrowed from the Papan Tanda direction. When `value` changes, each
 * letter clatters through random letters and lands on the new one, left to right.
 * First render shows the value as-is (no clatter on page load). Reduced motion: instant swap.
 *
 * variant "plain" sits inside other components (status badge); "board" draws dark cells (door sign).
 */
export function SplitFlap({
  value,
  speed = "badge",
  variant = "plain",
  className,
  cellClassName,
}: {
  value: string;
  speed?: SplitFlapSpeed;
  variant?: "plain" | "board";
  className?: string;
  cellClassName?: string;
}) {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState<Frame | null>(null);
  const shown = useRef(value);

  useEffect(() => {
    if (shown.current === value || reduce) {
      shown.current = value;
      return;
    }
    const from = shown.current;
    shown.current = value;

    const cfg = splitFlap[speed];
    const length = Math.max(from.length, value.length);
    const target = value.padEnd(length, " ");
    const start = from.padEnd(length, " ");
    const endTick = (i: number) => i * cfg.staggerTicks + cfg.baseTicks + i * cfg.ticksPerCell;
    const lastTick = endTick(length - 1);
    let tick = 0;
    let done = false;

    const id = window.setInterval(() => {
      tick += 1;
      if (tick > lastTick) {
        window.clearInterval(id);
        done = true;
        setFrame(null);
        return;
      }
      const chars: string[] = [];
      const flipping: boolean[] = [];
      for (let i = 0; i < length; i++) {
        const begins = i * cfg.staggerTicks;
        if (tick < begins) {
          chars.push(start[i]);
          flipping.push(false);
        } else if (tick < endTick(i)) {
          chars.push(target[i] === " " && start[i] === " " ? " " : ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
          flipping.push(true);
        } else {
          chars.push(target[i]);
          flipping.push(tick === endTick(i));
        }
      }
      setFrame({ chars, flipping });
    }, cfg.tickMs);

    return () => {
      window.clearInterval(id);
      // Interrupted (or React dev double-run): allow the next run to animate from the old value.
      if (!done) shown.current = from;
    };
  }, [value, speed, reduce]);

  const chars = frame?.chars ?? value.split("");
  const style = { "--flap-tick": `${splitFlap[speed].tickMs}ms` } as CSSProperties;

  return (
    <span className={cn("inline-flex", variant === "board" && "gap-1", className)} style={style}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex" style={{ perspective: 200, gap: "inherit" }}>
        {chars.map((char, i) => (
          <span
            key={i}
            className={cn(
              "relative inline-grid place-items-center font-mono",
              variant === "board" && "h-[1.8em] w-[1.25em] rounded-[3px] bg-(--flap-cell-bg) text-(--flap-cell-ink)",
              cellClassName,
            )}
          >
            <span
              // a new key restarts the CSS flip animation for each new letter
              key={`${i}-${char}`}
              className="flap-cell"
              data-flipping={frame?.flipping[i] ? "" : undefined}
            >
              {char === " " ? " " : char}
            </span>
            {variant === "board" && <span className="absolute inset-x-0 top-1/2 h-px bg-black/50" />}
          </span>
        ))}
      </span>
    </span>
  );
}
