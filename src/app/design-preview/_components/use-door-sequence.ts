"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export type DoorPhase = "closed" | "knock" | "sign" | "open";

export type DoorTiming = { knock: number; sign: number; open: number };

/**
 * Drives the "Knock once. The door opens." sequence: closed, knock, sign flips, door opens.
 * Under prefers-reduced-motion it jumps straight to the final, open state.
 */
export function useDoorSequence(timing: DoorTiming) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<DoorPhase>("closed");
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    // Every phase change goes through a timer, so nothing sets state synchronously in the effect.
    const at = (ms: number, next: DoorPhase) =>
      timers.current.push(window.setTimeout(() => setPhase(next), ms));
    if (reduce) {
      at(0, "open");
      return;
    }
    at(0, "closed");
    at(timing.knock, "knock");
    at(timing.sign, "sign");
    at(timing.open, "open");
  }, [clearTimers, reduce, timing]);

  useEffect(() => {
    play();
    return clearTimers;
  }, [play, clearTimers]);

  return {
    phase,
    replay: play,
    reduce: Boolean(reduce),
    knocking: phase === "knock",
    signFlipped: phase === "sign" || phase === "open",
    open: phase === "open",
  };
}
