"use client";

import { motion } from "motion/react";
import { HangingSign } from "./hanging-sign";
import { KpmLogo } from "./kpm-logo";
import { useDoorSequence, type DoorTiming } from "./use-door-sequence";

const TIMING: DoorTiming = { knock: 800, sign: 1400, open: 2300 };
// A heavy wooden door: long, smooth deceleration, no bounce.
const HEAVY = { duration: 1.6, ease: [0.22, 1, 0.36, 1] } as const;
const SIGN = { duration: 0.7, ease: [0.16, 1, 0.3, 1] } as const;

export function LampuDoor() {
  const { replay, reduce, knocking, signFlipped, open } = useDoorSequence(TIMING);
  const instant = { duration: 0 };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="relative w-full max-w-[270px] sm:max-w-[330px]" style={{ perspective: 1600 }}>
        <div className="preserve-3d relative aspect-[5/9] rounded-t-(--radius) bg-(--frame) p-3 pb-0">
          {/* the lit office behind the door */}
          <div
            className="absolute inset-x-3 bottom-0 top-3 flex flex-col justify-end gap-3 overflow-hidden rounded-t-[8px] p-4 text-[#1a1206]"
            style={{ background: "radial-gradient(120% 80% at 70% 20%, #ffe2b0 0%, var(--lamp) 45%, #b8691c 100%)" }}
          >
            <p className="text-xs font-medium opacity-75">Next appointment</p>
            <p className="font-display text-xl font-bold leading-tight">
              Tue, 20 Oct
              <br />
              10:00 - 10:30
            </p>
            <p className="text-xs opacity-80">Room B2.14 with Dr. Nurul Huda</p>
            <p className="text-xs font-semibold">3 open slots this week</p>
          </div>

          {/* light leaking through the latch-side gap, before the door moves */}
          <motion.div
            aria-hidden
            className="absolute bottom-0 right-3 top-3 w-[3px] bg-(--lamp)"
            style={{ filter: "blur(2px)" }}
            initial={false}
            animate={{ opacity: signFlipped && !open ? 1 : 0 }}
            transition={reduce ? instant : { duration: 0.5 }}
          />

          {/* door leaf */}
          <motion.div
            className="preserve-3d absolute inset-x-3 bottom-0 top-3 origin-left"
            animate={{ rotateY: open ? -112 : 0, x: knocking ? [0, -2, 1, 0] : 0 }}
            transition={reduce ? instant : { rotateY: HEAVY, x: { duration: 0.25 } }}
          >
            <div
              className="backface-hidden absolute inset-0 flex flex-col items-center rounded-t-[8px] px-5 pt-5"
              style={{
                transform: "translateZ(7px)",
                background: "linear-gradient(160deg, #4a3020 0%, var(--door) 45%, #2a1b10 100%)",
              }}
            >
              <HangingSign flipped={signFlipped} transition={reduce ? instant : SIGN} />
              {/* recessed panels */}
              <div className="mt-5 grid w-full flex-1 grid-rows-[1fr_1.3fr] gap-3 pb-5">
                <div className="rounded-[6px] shadow-[inset_0_2px_6px_rgb(0_0_0/0.45),inset_0_-1px_0_rgb(255_255_255/0.06)]" />
                <div className="rounded-[6px] shadow-[inset_0_2px_6px_rgb(0_0_0/0.45),inset_0_-1px_0_rgb(255_255_255/0.06)]" />
              </div>
              {/* steel nameplate */}
              <div className="absolute left-1/2 top-[38%] w-[78%] -translate-x-1/2 rounded-[6px] bg-(--plate) p-2.5 text-center text-[#12162b] shadow-[0_2px_8px_rgb(0_0_0/0.4)]">
                <KpmLogo className="mx-auto h-8 w-auto" />
                <p className="mt-1.5 text-[11px] font-bold leading-tight">Dr. Nurul Huda binti Ismail</p>
                <p className="text-[10px] opacity-70">Pensyarah Kanan, B2.14</p>
              </div>
              <div className="absolute right-4 top-[56%] h-3 w-3 rounded-full bg-[#d9c7a3] shadow-[0_1px_3px_rgb(0_0_0/0.5)]" />
            </div>
            <div
              className="absolute top-0 h-full w-3.5"
              style={{ left: "calc(100% - 7px)", transform: "rotateY(90deg)", background: "var(--door-edge)" }}
            />
            <div
              className="backface-hidden absolute inset-0 rounded-t-[8px] bg-(--door-edge)"
              style={{ transform: "rotateY(180deg) translateZ(7px)" }}
            />
          </motion.div>
        </div>

        {/* lamp light spilling across the corridor floor */}
        <motion.div
          aria-hidden
          className="pointer-events-none -mx-6 h-16 origin-top"
          style={{
            background: "linear-gradient(to bottom, color-mix(in oklab, var(--lamp) 55%, transparent), transparent)",
            // wedge: door-width at the threshold, widening toward the viewer
            clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
          }}
          initial={false}
          animate={{ opacity: open ? 1 : 0, scaleY: open ? 1 : 0.2 }}
          transition={reduce ? instant : { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: open ? 0.2 : 0 }}
        />
      </div>
      <button
        type="button"
        onClick={replay}
        className="rounded-(--radius) border border-(--line) px-4 py-2 text-sm transition-transform duration-100 active:scale-[0.97]"
      >
        Knock again
      </button>
    </div>
  );
}
