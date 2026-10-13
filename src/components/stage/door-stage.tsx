"use client";

import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { SplitFlap } from "@/components/ui/split-flap";
import { cn } from "@/lib/cn";
import { CssDoor } from "./css-door";
import { useDoor } from "./door-context";

// three.js only loads here, only in the browser, only when allowed (see below).
const DoorScene = dynamic(() => import("./door-scene"), { ssr: false });

type Mode = "css" | "loading-3d" | "3d";

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

/**
 * The door on the login / landing stage (DESIGN.md section 9).
 * 1. First paint is the CSS door, so the page never waits for three.js (NFR04).
 * 2. Once the stage is on screen and the browser is idle, the 3D scene loads and cross-fades in.
 * 3. 3D is skipped under reduced motion, save-data, or without WebGL: the CSS door stays.
 * The split-flap sign above shows SILA KETUK, then SILA MASUK when the door opens.
 */
export function DoorStage({ className }: { className?: string }) {
  const { open } = useDoor();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("css");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || prefersSavingData() || !canUseWebGL()) return;
    const el = stageRef.current;
    if (!el) return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const start = () => setMode((m) => (m === "css" ? "loading-3d" : m));

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(start, { timeout: 2000 });
      else timeoutId = window.setTimeout(start, 400);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [reduce]);

  const onReady = useCallback(() => setMode("3d"), []);

  return (
    <div className={cn("flex w-full max-w-[360px] flex-col items-center gap-5", className)}>
      <div
        className="flex items-center gap-3 font-mono text-xl font-bold sm:text-2xl"
        role="img"
        aria-label={open ? "Sign: Sila masuk, please come in" : "Sign: Sila ketuk, please knock"}
      >
        <span className="text-sm text-muted">SILA</span>
        <span className="relative">
          <SplitFlap value={open ? "MASUK" : "KETUK"} speed="sign" variant="board" />
          <span
            aria-hidden
            className={cn("absolute inset-x-0 -bottom-2 h-1 rounded-full transition-colors duration-300", open ? "bg-sign-go" : "bg-sign-stop")}
          />
        </span>
      </div>

      {/* the stage: a window into the corridor, same framing for the CSS and 3D door */}
      <div ref={stageRef} className="relative aspect-[5/8] w-full overflow-hidden rounded-card bg-(--door-wall)">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[11%] bg-(--door-floor)" />
        <div
          className={cn(
            "absolute bottom-[11%] left-[15.5%] right-[15.5%] top-[6%] transition-opacity duration-700",
            mode === "3d" && "opacity-0",
          )}
        >
          <CssDoor open={open} />
        </div>
        {mode !== "css" && (
          <div className={cn("absolute inset-0 transition-opacity duration-700", mode === "3d" ? "opacity-100" : "opacity-0")}>
            <DoorScene open={open} onReady={onReady} />
          </div>
        )}
      </div>
    </div>
  );
}
