/**
 * SCAS motion presets. Every animation in the app uses these values; see DESIGN.md "Motion".
 *
 * Two lanes:
 * - App lane (dashboards, forms): fast, no bounce, 120 to 240 ms. Things people do many times a day.
 * - Stage lane (login, sign up): cinematic, only for the door moment people see once per visit.
 *
 * Page enter inside the AppShell is the CSS utility `animate-page-enter` (globals.css), so content
 * never waits for JavaScript to become visible.
 *
 * prefers-reduced-motion: the root <MotionConfig reducedMotion="user"> drops transform animations,
 * and components that animate on their own (split-flap, door) check useReducedMotion() and jump
 * to the end state.
 */

export const ease = {
  /** Default for anything entering or responding: fast start, soft landing. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric, for things that move from A to B (drawer, mechanical swing). */
  inOut: [0.65, 0, 0.35, 1],
  /** Heavy objects: the office door. */
  heavy: [0.22, 1, 0.36, 1],
} as const;

/** Seconds. */
export const duration = {
  micro: 0.12, // press, hover, toggle
  fast: 0.18, // badge swap, toast exit, page enter
  base: 0.24, // drawer, toast enter, panels
  slow: 0.4, // counters, larger reveals (rare)
  door: 1.6, // stage lane only
} as const;

export const transition = {
  micro: { duration: duration.micro, ease: ease.out },
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  drawer: { duration: duration.base, ease: ease.inOut },
  counter: { duration: 0.6, ease: ease.out },
  door: { duration: duration.door, ease: ease.heavy },
  sign: { duration: 0.7, ease: ease.out },
} as const;

export const variants = {
  /** Toasts rise in from below, leave by fading (exits are quieter than entrances). */
  toast: {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: transition.base },
    exit: { opacity: 0, scale: 0.98, transition: transition.fast },
  },
  /** Mobile sidebar drawer and its scrim. */
  drawer: {
    initial: { x: "-100%" },
    animate: { x: 0, transition: transition.drawer },
    exit: { x: "-100%", transition: transition.fast },
  },
  scrim: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.fast },
    exit: { opacity: 0, transition: transition.fast },
  },
} as const;

/**
 * Split-flap timing. A cell flips `baseTicks + index * ticksPerCell` times, starting
 * `index * staggerTicks` ticks late, then lands on the new letter.
 * - badge: small and fast, the whole change is done in about 300 ms
 * - sign: the door sign on login / sign up, slower and louder
 */
export const splitFlap = {
  badge: { tickMs: 28, baseTicks: 3, ticksPerCell: 1, staggerTicks: 0 },
  sign: { tickMs: 60, baseTicks: 5, ticksPerCell: 2, staggerTicks: 1 },
} as const;

export type SplitFlapSpeed = keyof typeof splitFlap;
