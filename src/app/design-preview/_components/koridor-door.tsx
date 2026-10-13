"use client";

import { AnimatePresence, motion } from "motion/react";
import { HangingSign } from "./hanging-sign";
import { KpmLogo } from "./kpm-logo";
import { useDoorSequence, type DoorTiming } from "./use-door-sequence";

const TIMING: DoorTiming = { knock: 700, sign: 1150, open: 1750 };

// Physical hinge: soft spring with a small overshoot, like a real door settling.
const HINGE = { type: "spring", stiffness: 55, damping: 11, mass: 1.1 } as const;
const SIGN = { type: "spring", stiffness: 160, damping: 18 } as const;

export function KoridorDoor() {
  const { replay, reduce, knocking, signFlipped, open } = useDoorSequence(TIMING);
  const instant = { duration: 0 };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-[270px] sm:max-w-[330px]" style={{ perspective: 1600 }}>
        {/* door frame */}
        <div className="preserve-3d relative aspect-[5/9] rounded-(--radius) bg-(--frame) p-3">
          {/* the office behind the door: a glimpse of the dashboard */}
          <div className="absolute inset-3 flex flex-col justify-end gap-3 rounded-[4px] bg-(--surface) p-4">
            <p className="text-xs text-(--muted)">Next appointment</p>
            <p className="font-display text-lg font-semibold leading-tight">
              Tue, 20 Oct
              <br />
              10:00 - 10:30
            </p>
            <p className="text-xs text-(--muted)">Room B2.14 with Dr. Nurul Huda</p>
            <div className="flex flex-wrap gap-1.5">
              {["Mon 10:00", "Wed 10:00", "Thu 10:00"].map((s) => (
                <span key={s} className="rounded-full border border-(--line) px-2 py-0.5 text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* door leaf */}
          <motion.div
            className="preserve-3d absolute inset-3 origin-left"
            animate={{ rotateY: open ? -108 : 0 }}
            transition={reduce ? instant : HINGE}
          >
            {/* front face */}
            <div
              className="backface-hidden absolute inset-0 flex flex-col items-center rounded-[4px] bg-(--door) px-5 pt-6 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
              style={{ transform: "translateZ(6px)" }}
            >
              <HangingSign flipped={signFlipped} transition={reduce ? instant : SIGN} />
              {/* nameplate */}
              <div className="mt-8 w-full rounded-[4px] bg-(--plate) p-3 text-center text-[#151a30]">
                <KpmLogo className="mx-auto h-9 w-auto" />
                <p className="mt-2 text-[12px] font-semibold leading-tight">Dr. Nurul Huda binti Ismail</p>
                <p className="text-[10px] text-[#565c70]">Pensyarah Kanan, B2.14</p>
              </div>
              {/* handle */}
              <div className="absolute right-4 top-[55%] h-2 w-10 rounded-full bg-[#c9ccd6] shadow-[0_1px_2px_rgb(0_0_0/0.3)]" />
              {/* knock ripple: feedback that the knock happened */}
              <AnimatePresence>
                {knocking && (
                  <motion.span
                    key="knock"
                    className="pointer-events-none absolute left-1/2 top-[68%] h-10 w-10 -translate-x-1/2 rounded-full border-2 border-white/60"
                    initial={{ scale: 0.6, opacity: 0.9 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </AnimatePresence>
            </div>
            {/* edge, gives the leaf real thickness while it swings */}
            <div
              className="absolute top-0 h-full w-3 bg-(--door-edge)"
              style={{ left: "calc(100% - 6px)", transform: "rotateY(90deg)" }}
            />
            {/* back face */}
            <div
              className="backface-hidden absolute inset-0 rounded-[4px] bg-(--door-edge)"
              style={{ transform: "rotateY(180deg) translateZ(6px)" }}
            />
          </motion.div>
        </div>
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
