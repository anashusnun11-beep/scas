"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { KpmLogo } from "./kpm-logo";
import { useDoorSequence, type DoorTiming } from "./use-door-sequence";

const TIMING: DoorTiming = { knock: 600, sign: 900, open: 2100 };
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// Crisp, no-bounce swing: signage is mechanical, not springy.
const SWING = { duration: 0.8, ease: [0.65, 0, 0.35, 1] } as const;

/** One split-flap cell. Clatters through random letters, then lands on the target. */
function FlapCell({ target, index, go, reduce }: { target: string; index: number; go: boolean; reduce: boolean }) {
  const [char, setChar] = useState(target);
  const [settled, setSettled] = useState(true);
  const lastGo = useRef(go);

  useEffect(() => {
    // Only clatter when the sign actually changes, not on first load.
    if (lastGo.current === go) return;
    const previousGo = lastGo.current;
    lastGo.current = go;
    let done = false;
    let ticks = 0;
    const totalTicks = reduce ? 0 : 5 + index * 2;
    let interval = 0;
    const start = window.setTimeout(() => {
      setSettled(false);
      interval = window.setInterval(() => {
        ticks += 1;
        if (ticks >= totalTicks) {
          window.clearInterval(interval);
          setChar(target);
          setSettled(true);
          done = true;
        } else {
          setChar(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
        }
      }, reduce ? 0 : 60);
    }, reduce ? 0 : index * 40);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
      // Interrupted (or React dev double-run): let the next run flip this cell again.
      if (!done) lastGo.current = previousGo;
    };
    // `go` is a dependency so cells whose letter is the same in both words (U, K) still flap.
  }, [target, index, go, reduce]);

  return (
    <span className="relative grid h-11 w-8 place-items-center overflow-hidden bg-[#22252c] sm:h-12 sm:w-9" style={{ perspective: 200 }}>
      <motion.span
        key={char}
        className="font-mono-dp text-2xl font-bold text-(--board-ink)"
        // Static letters render as-is (also server-side); only clattering letters flip in.
        initial={!settled && !reduce ? { rotateX: -90 } : false}
        animate={{ rotateX: 0 }}
        transition={{ duration: 0.05, ease: "linear" }}
      >
        {char}
      </motion.span>
      {/* the hinge line of a real split-flap cell */}
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
      <span
        className={`absolute inset-x-0 bottom-0 h-1 ${settled ? "" : "opacity-0"}`}
        style={{ background: go ? "var(--sign-go)" : "var(--sign-stop)" }}
      />
    </span>
  );
}

export function PapanDoor() {
  const { replay, reduce, knocking, signFlipped, open } = useDoorSequence(TIMING);
  const word = signFlipped ? "MASUK" : "KETUK";

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-[280px] sm:max-w-[340px]">
        {/* split-flap board on the frame, stays readable after the door opens */}
        <div
          className="flex items-center justify-center gap-1 bg-(--board) px-3 py-3"
          role="img"
          aria-label={signFlipped ? "Board: Sila masuk (please come in)" : "Board: Sila ketuk (please knock)"}
        >
          <span className="font-mono-dp mr-2 text-sm font-bold text-(--board-ink)/70">SILA</span>
          {word.split("").map((c, i) => (
            <FlapCell key={i} target={c} index={i} go={signFlipped} reduce={reduce} />
          ))}
        </div>

        <div className="relative aspect-[5/8] bg-(--frame) px-3 pb-0 pt-3" style={{ perspective: 1800 }}>
          {/* behind the door: departure-board schedule */}
          <div className="font-mono-dp absolute inset-x-3 bottom-0 top-3 flex flex-col justify-end gap-2 bg-(--board) p-4 text-(--board-ink)">
            <p className="text-[11px] text-(--board-ink)/60">NEXT CONSULTATION</p>
            <p className="text-xl font-bold leading-tight text-(--primary)">TUE 20 OCT</p>
            <p className="text-xl font-bold leading-tight">10:00 B2.14</p>
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
              <span className="text-(--board-ink)/60">MON 19</span><span>10:00 OPEN</span>
              <span className="text-(--board-ink)/60">WED 21</span><span>10:00 OPEN</span>
              <span className="text-(--board-ink)/60">THU 22</span><span>10:00 OPEN</span>
            </div>
          </div>

          {/* door leaf */}
          <motion.div
            className="preserve-3d absolute inset-x-3 bottom-0 top-3 origin-left"
            animate={{ rotateY: open ? -100 : 0, scale: knocking ? 0.985 : 1 }}
            transition={reduce ? { duration: 0 } : { rotateY: SWING, scale: { duration: 0.08 } }}
          >
            <div
              className="backface-hidden absolute inset-0 flex flex-col justify-between bg-(--door) p-5 text-[#15171c]"
              style={{ transform: "translateZ(5px)" }}
            >
              <p className="font-display text-[64px] font-black leading-none tracking-tight" style={{ fontStretch: "125%" }}>
                B2
                <br />
                .14
              </p>
              <div className="border-2 border-[#15171c] bg-(--plate) p-3">
                <KpmLogo className="h-8 w-auto" />
                <p className="font-display mt-2 text-[13px] font-extrabold uppercase leading-tight" style={{ fontStretch: "112%" }}>
                  Dr. Nurul Huda binti Ismail
                </p>
                <p className="font-mono-dp text-[10px]">PENSYARAH KANAN</p>
              </div>
              <div className="absolute right-4 top-1/2 h-12 w-2.5 bg-[#15171c]" />
            </div>
            <div
              className="absolute top-0 h-full w-2.5 bg-(--door-edge)"
              style={{ left: "calc(100% - 5px)", transform: "rotateY(90deg)" }}
            />
            <div
              className="backface-hidden absolute inset-0 bg-(--door-edge)"
              style={{ transform: "rotateY(180deg) translateZ(5px)" }}
            />
          </motion.div>
        </div>
      </div>
      <button
        type="button"
        onClick={replay}
        className="border-2 border-(--line) px-4 py-2 text-sm font-semibold uppercase transition-transform duration-100 active:translate-y-px"
      >
        Knock again
      </button>
    </div>
  );
}
