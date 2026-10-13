"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { DirectionSlug } from "../_lib/directions";

// Sample data for the preview only (matches the seeded lecturer and slot times).
const STATS = [
  { label: "Upcoming", value: 1 },
  { label: "Pending", value: 2 },
  { label: "Approved", value: 3 },
  { label: "Completed", value: 7 },
];

const SLOTS = [
  { id: 1, day: "Mon, 19 Oct", time: "10:00 - 10:30", booked: false },
  { id: 2, day: "Tue, 20 Oct", time: "10:00 - 10:30", booked: true },
  { id: 3, day: "Wed, 21 Oct", time: "10:00 - 10:30", booked: false },
  { id: 4, day: "Thu, 22 Oct", time: "10:00 - 10:30", booked: false },
];

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "CANCELLED", "COMPLETED"] as const;
type Status = (typeof STATUSES)[number];

// Dashboard motion follows the fast lane: under 250 ms, no bounce.
const FAST = { duration: 0.18, ease: [0.16, 1, 0.3, 1] } as const;

function Counter({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, count]);

  return (
    <span ref={ref} aria-label={String(value)}>
      <motion.span aria-hidden>{rounded}</motion.span>
    </span>
  );
}

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span
      className={`badge inline-flex items-center rounded-(--radius) px-2 py-0.5 text-[11px] font-bold tracking-wide ${className}`}
      style={{ ["--st" as string]: `var(--st-${status.toLowerCase()})` }}
    >
      {status}
    </span>
  );
}

export function AppSample({ slug }: { slug: DirectionSlug }) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(1);
  const [status, setStatus] = useState<Status>("PENDING");
  const mono = slug === "papan" ? "font-mono-dp" : "";
  const card = slug === "papan" ? "border-2 border-(--line)" : "border border-(--line)";

  return (
    <div className="grid gap-4">
      {/* stat counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className={`rounded-(--radius) bg-(--surface) p-4 ${card}`}>
            <p className="text-xs text-(--muted)">{s.label}</p>
            <p className={`font-display mt-1 text-3xl font-bold ${mono}`}>
              <Counter value={s.value} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        {/* assigned lecturer */}
        <div className={`rounded-(--radius) bg-(--surface) p-5 ${card}`}>
          <p className="text-xs text-(--muted)">Your lecturer</p>
          <p className="font-display mt-1 text-lg font-semibold leading-tight">Dr. Nurul Huda binti Ismail</p>
          <p className="text-sm text-(--muted)">Senior Lecturer, Computer Science</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-(--muted)">Office</dt>
            <dd>Block B, Level 2, Room 2.14</dd>
            <dt className="text-(--muted)">Phone</dt>
            <dd className={mono}>03-8925 1214</dd>
          </dl>
        </div>

        {/* slots */}
        <div className={`rounded-(--radius) bg-(--surface) p-5 ${card}`}>
          <p className="font-display font-semibold">Open slots next week</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SLOTS.map((slot) => {
              const isSelected = selected === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={slot.booked}
                  onClick={() => setSelected(slot.id)}
                  aria-pressed={isSelected}
                  className={`rounded-(--radius) px-3 py-2.5 text-left text-sm transition-[transform,background-color,color] duration-150 active:scale-[0.97] disabled:cursor-not-allowed ${
                    slot.booked
                      ? "bg-(--surface-2) text-(--muted) line-through"
                      : isSelected
                        ? "bg-(--primary) text-(--on-primary)"
                        : `bg-(--bg) hover:bg-(--surface-2) ${card}`
                  }`}
                >
                  <span className="block font-semibold">{slot.day}</span>
                  <span className={`block text-xs ${mono}`}>{slot.booked ? "Booked" : slot.time}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* status change + form */}
      <div className={`grid gap-5 rounded-(--radius) bg-(--surface) p-5 md:grid-cols-2 ${card}`}>
        <div>
          <p className="font-display font-semibold">Appointment status</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-(--radius) bg-(--bg) p-3">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${mono}`}>APT-0012</p>
              <p className="truncate text-xs text-(--muted)">FYP proposal discussion</p>
            </div>
            <div className="grid min-w-[104px] justify-items-end">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4, transition: { duration: 0.12 } }}
                  transition={FAST}
                >
                  <StatusBadge status={status} />
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatus(status === "PENDING" ? "APPROVED" : "PENDING")}
            className="mt-3 rounded-(--radius) border border-(--line) px-3 py-1.5 text-sm transition-transform duration-100 active:scale-[0.97]"
          >
            {status === "PENDING" ? "Simulate approval" : "Reset to pending"}
          </button>
        </div>

        <form className="grid content-start gap-2" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={`purpose-${slug}`} className="text-sm font-semibold">
            Purpose of consultation <span className="text-(--sign-stop)">*</span>
          </label>
          <textarea
            id={`purpose-${slug}`}
            rows={3}
            defaultValue="Discuss final year project scope and the booking module."
            className="resize-none rounded-(--radius) border border-(--line) bg-(--bg) px-3 py-2 text-sm text-(--ink) outline-none focus-visible:border-(--focus)"
          />
          <p className="text-xs text-(--muted)">Your lecturer sees this with the request.</p>
          <button
            type="submit"
            className={`mt-1 justify-self-start rounded-(--radius) bg-(--primary) px-5 py-2.5 text-sm font-semibold text-(--on-primary) transition-transform duration-100 active:scale-[0.97] ${
              slug === "papan" ? "uppercase" : ""
            }`}
          >
            Submit booking
          </button>
        </form>
      </div>
    </div>
  );
}
