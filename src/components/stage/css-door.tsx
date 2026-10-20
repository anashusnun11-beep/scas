import { KpmLogo } from "@/components/brand/kpm-logo";
import { cn } from "@/lib/cn";

/**
 * Static CSS door: the first paint on the login stage, and the full fallback when 3D is
 * skipped (reduced motion, save-data, no WebGL). Opening uses CSS transitions, so it works without
 * JS-driven animation, and the global reduced-motion rule makes it instant.
 */
export function CssDoor({ open = false, className }: { open?: boolean; className?: string }) {
  const swing = "transition-[transform,opacity] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const amount = open ? "1" : "0";

  return (
    <div className={cn("relative h-full w-full", className)} style={{ perspective: 1600 }}>
      <div className="relative h-full rounded-t-card bg-(--door-frame) p-3 pb-0 [transform-style:preserve-3d]">
        {/* lit office behind the door */}
        <div
          className="absolute inset-x-3 bottom-0 top-3 rounded-t-[8px]"
          style={{ background: "radial-gradient(120% 80% at 70% 20%, var(--lamp-core) 0%, var(--lamp) 45%, var(--lamp-deep) 100%)" }}
        />
        {/* light leaking through the latch-side gap while the door is shut */}
        <div
          aria-hidden
          className="absolute bottom-0 right-3 top-3 w-[3px] bg-(--lamp) blur-[2px] transition-opacity duration-500"
          style={{ opacity: `calc(1 - min(1, ${amount} * 6))` }}
        />

        {/* door leaf */}
        <div
          className={cn("absolute inset-x-3 bottom-0 top-3 origin-left [transform-style:preserve-3d]", swing)}
          style={{ transform: `rotateY(calc(${amount} * -112deg))` }}
        >
          <div
            className="absolute inset-0 flex flex-col rounded-t-[8px] px-[9%] pb-[8%] pt-[10%] [backface-visibility:hidden]"
            style={{
              transform: "translateZ(7px)",
              background: "linear-gradient(160deg, var(--door-wood-light) 0%, var(--door-wood) 45%, var(--door-wood-dark) 100%)",
            }}
          >
            <div className="grid flex-1 grid-rows-[1fr_1.3fr] gap-[6%]">
              <div className="rounded-[6px] shadow-[inset_0_2px_6px_rgb(0_0_0/0.45),inset_0_-1px_0_rgb(255_255_255/0.06)]" />
              <div className="rounded-[6px] shadow-[inset_0_2px_6px_rgb(0_0_0/0.45),inset_0_-1px_0_rgb(255_255_255/0.06)]" />
            </div>
            {/* nameplate with the official logo on its light plate */}
            <KpmLogo className="absolute left-1/2 top-[34%] h-16 -translate-x-1/2 p-2 shadow-[0_2px_8px_rgb(0_0_0/0.4)]" />
            <div className="absolute right-[8%] top-[56%] size-3 rounded-full bg-(--door-handle) shadow-[0_1px_3px_rgb(0_0_0/0.5)]" />
          </div>
          <div
            className="absolute top-0 h-full w-3.5 bg-(--door-edge)"
            style={{ left: "calc(100% - 7px)", transform: "rotateY(90deg)" }}
          />
          <div
            className="absolute inset-0 rounded-t-[8px] bg-(--door-edge) [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg) translateZ(7px)" }}
          />
        </div>
      </div>

      {/* lamp light spilling across the floor once the door opens */}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute -bottom-16 -inset-x-6 h-16 origin-top", swing)}
        style={{
          opacity: amount,
          transform: `scaleY(calc(0.2 + ${amount} * 0.8))`,
          background: "linear-gradient(to bottom, color-mix(in oklab, var(--lamp) 55%, transparent), transparent)",
          clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
        }}
      />
    </div>
  );
}
