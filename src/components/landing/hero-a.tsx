"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CssDoor } from "@/components/stage/css-door";
import type { DoorDriver } from "@/components/stage/door-scene";
import { SplitFlap } from "@/components/ui/split-flap";
import { cn } from "@/lib/cn";

// Heavy parts load only for the desktop scroll sequence, never during SSR and never on phones.
const DoorScene = dynamic(() => import("@/components/stage/door-scene"), { ssr: false });
const DashboardPreview = dynamic(() => import("./dashboard-preview"), { ssr: false });

/**
 * - static: first paint and reduced motion (door shown open, sign MASUK, nothing moves).
 * - reveal: phones, tablets, touch, save-data. CSS door; knock, flip and open once it is on screen.
 * - scroll: desktop with a mouse. Pinned GSAP ScrollTrigger sequence, 3D door when WebGL allows.
 */
type Mode = "static" | "reveal" | "scroll";
type Scene = "css" | "loading-3d" | "3d";

const DESKTOP = "(min-width: 1024px) and (pointer: fine)";

/**
 * A media query, hydration-safe: null during SSR and hydration (so the first client render matches
 * the server HTML), the real value right after.
 */
function useMedia(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

function savesData() {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Layout offset of `el` inside `ancestor` (ignores transforms, so GSAP's own moves don't skew it). */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

const KNOCKS = ["tok,", "tok,", "tok."];

export function HeroA({ actions }: { actions: ReactNode }) {
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  const desktop = useMedia(DESKTOP) === true && !savesData();
  // null = preference not known yet (SSR and first render): stay static until it is.
  const mode: Mode = reduce !== false ? "static" : desktop ? "scroll" : "reveal";
  const [scene, setScene] = useState<Scene>("css");
  const [flipped, setFlipped] = useState(false);
  const [knocked, setKnocked] = useState(false);
  const driver = useRef<DoorDriver>({ knock: 0, door: 0, camera: 0 });
  const redraw = useRef<(() => void) | undefined>(undefined);
  const onInvalidate = useCallback((fn: (() => void) | undefined) => {
    redraw.current = fn;
  }, []);
  // Reduced motion: the door is open and the sign says MASUK from the start.
  const signOpen = reduce === true || flipped;

  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const doorRef = useRef<HTMLDivElement>(null);
  const knockRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  // reveal: knock, flip the sign, open the door, once, when the door is on screen.
  useEffect(() => {
    if (mode !== "reveal") return;
    const stage = stageRef.current;
    const door = doorRef.current;
    if (!stage || !door) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timers.push(window.setTimeout(() => setKnocked(true), 250));
        timers.push(window.setTimeout(() => setFlipped(true), 1500));
        timers.push(window.setTimeout(() => stage.style.setProperty("--door-open", "1"), 1900));
      },
      { threshold: 0.5 },
    );
    io.observe(door);
    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
      stage.style.removeProperty("--door-open");
      setKnocked(false);
      setFlipped(false);
    };
  }, [mode]);

  // scroll: 3D door on idle (WebGL only), and the pinned GSAP sequence.
  useEffect(() => {
    if (mode !== "scroll" || !canUseWebGL()) return;
    const start = () => setScene((s) => (s === "css" ? "loading-3d" : s));
    const id = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 300);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "scroll") return;
    const stage = stageRef.current;
    const copy = copyRef.current;
    const door = doorRef.current;
    const knocks = knockRef.current;
    if (!stage || !copy || !door || !knocks) return;

    let revert: (() => void) | undefined;
    let cancelled = false;
    const d = driver.current;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const draw = () => redraw.current?.();
      const words = Array.from(knocks.children) as HTMLElement[];
      // Door card centred in the viewport, slightly larger: "walking up to the door".
      const doorShift = () => {
        const at = offsetWithin(door, stage);
        return { x: stage.clientWidth / 2 - (at.x + door.offsetWidth / 2), y: stage.clientHeight / 2 - (at.y + door.offsetHeight / 2) };
      };
      const ZOOM = 1.45;

      const ctx = gsap.context(() => {
        gsap.set(stage, { "--door-open": 0 });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=320%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const open = self.progress > 0.17;
              setFlipped((was) => (was === open ? was : open));
            },
          },
        });

        // 1. Knock (0 - 0.14): three raps, the door rattles, the words appear one by one.
        tl.to(d, { knock: 1, duration: 0.14, onUpdate: draw }, 0);
        tl.to(door, { keyframes: [{ x: -3 }, { x: 3 }, { x: 0 }, { x: -3 }, { x: 3 }, { x: 0 }, { x: -3 }, { x: 3 }, { x: 0 }], duration: 0.14 }, 0);
        words.forEach((w, i) => tl.fromTo(w, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.03, ease: "power2.out" }, 0.01 + i * 0.045));
        tl.to(words, { autoAlpha: 0, duration: 0.05 }, 0.19);

        // 2. The sign flips at 0.17 (onUpdate above); the headline steps aside.
        tl.to(copy, { autoAlpha: 0, y: -48, duration: 0.14, ease: "power1.in" }, 0.16);

        // 3. The door swings open (0.20 - 0.50).
        tl.to(d, { door: 1, duration: 0.3, ease: "power1.inOut", onUpdate: draw }, 0.2);
        tl.to(stage, { "--door-open": 1, duration: 0.3, ease: "power1.inOut" }, 0.2);

        // 4. Walk through: the door comes to the centre and the camera enters the lit office (0.45 - 0.80).
        tl.to(door, { x: () => doorShift().x, y: () => doorShift().y, scale: ZOOM, duration: 0.33, ease: "power2.inOut" }, 0.45);
        tl.to(d, { camera: 1, duration: 0.35, ease: "power1.inOut", onUpdate: draw }, 0.45);
        if (signRef.current) tl.to(signRef.current, { autoAlpha: 0, y: -16, duration: 0.1 }, 0.45);

        // 5. The dashboard grows out of the doorway until it fills the screen (0.72 - 0.97).
        if (dashRef.current) {
          const dash = dashRef.current;
          tl.fromTo(dash, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.72);
          tl.fromTo(
            dash,
            { scale: () => (door.offsetWidth * ZOOM * 0.92) / stage.clientWidth, borderRadius: 24 },
            { scale: 1, borderRadius: 0, duration: 0.25, ease: "power2.inOut" },
            0.72,
          );
        }
        tl.to({}, { duration: 0.03 }, 0.97);
      }, stage);

      revert = () => ctx.revert();
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      revert?.();
      Object.assign(d, { knock: 0, door: 0, camera: 0 });
      stage.style.removeProperty("--door-open");
      setFlipped(false);
    };
  }, [mode]);

  const onReady = useCallback(() => setScene("3d"), []);

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div
        ref={stageRef}
        className="hero-door relative min-h-[100dvh] overflow-hidden bg-(--door-wall)"
        style={{
          backgroundImage:
            "radial-gradient(55% 60% at 72% 48%, color-mix(in oklab, var(--lamp) 14%, transparent), transparent 70%), linear-gradient(to top, var(--door-floor), transparent 35%)",
        }}
      >
        <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-12 px-4 pb-16 pt-28 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:px-8 lg:pb-12">
          <div ref={copyRef}>
            <p className="text-sm font-semibold text-accent-ink">Student Consultation Appointment System, KPM Beranang</p>
            <h1 id="hero-title" className="mt-5 font-display text-[clamp(2.75rem,5.4vw,4.75rem)] font-bold leading-[1.02] tracking-tight">
              Knock once.
              <br />
              <span className="text-primary">The door opens.</span>
            </h1>
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted">
              Book consultation time with your lecturer. Pick a slot, get approved, and walk in when the sign says masuk.
            </p>
            <div className="mt-9">{actions}</div>
          </div>

          <div className="relative flex w-full flex-col items-center gap-5 justify-self-center">
            <div ref={signRef} className="flex items-center gap-3 font-mono text-xl font-bold sm:text-2xl" role="img" aria-label={signOpen ? "Sign: Sila masuk, please come in" : "Sign: Sila ketuk, please knock"}>
              <span className="text-sm text-muted">SILA</span>
              <span className="relative">
                <SplitFlap value={signOpen ? "MASUK" : "KETUK"} speed="sign" variant="board" />
                <span aria-hidden className={cn("absolute inset-x-0 -bottom-2 h-1 rounded-full transition-colors duration-300", signOpen ? "bg-sign-go" : "bg-sign-stop")} />
              </span>
            </div>

            <div ref={doorRef} className="relative aspect-[5/8] w-full max-w-[260px] overflow-hidden sm:max-w-[320px] lg:max-w-[360px] rounded-card bg-(--door-wall) shadow-float will-change-transform">
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[11%] bg-(--door-floor)" />
              <div className={cn("absolute bottom-[11%] left-[15.5%] right-[15.5%] top-[6%] transition-opacity duration-700", scene === "3d" && "opacity-0")}>
                <CssDoor driven smooth={mode !== "scroll"} />
              </div>
              {scene !== "css" && (
                <div className={cn("absolute inset-0 transition-opacity duration-700", scene === "3d" ? "opacity-100" : "opacity-0")}>
                  <DoorScene driver={driver} onInvalidate={onInvalidate} onReady={onReady} />
                </div>
              )}
            </div>

            {/* the knock, as words: visual only, the sign already says it for screen readers */}
            <div ref={knockRef} aria-hidden className="pointer-events-none absolute -right-2 top-[38%] grid gap-3 font-display text-2xl font-semibold italic text-primary sm:-right-8 lg:-right-16">
              {KNOCKS.map((word, i) => (
                <span
                  key={i}
                  className={cn(mode !== "scroll" && "transition-[opacity,transform] duration-300 ease-out-soft", mode !== "scroll" && (knocked ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"), mode === "scroll" && "opacity-0")}
                  style={mode !== "scroll" ? { transitionDelay: `${i * 380}ms`, marginLeft: `${i * 18}px` } : { marginLeft: `${i * 18}px` }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {mode === "scroll" && (
          <div ref={dashRef} className="pointer-events-none invisible absolute inset-0 origin-center overflow-hidden opacity-0 shadow-float will-change-transform">
            <DashboardPreview />
          </div>
        )}
      </div>
    </section>
  );
}
