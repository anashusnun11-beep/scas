import { SessionActions } from "./session-actions";

/** The last chapter: the same promise as the hero, and the way in. */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden px-4 py-32 lg:px-8 lg:py-48">
      {/* lamp light falling from a half-open door at the top of the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-full max-w-4xl"
        style={{ background: "radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, var(--lamp) 30%, transparent), transparent 70%)" }}
      />
      <div className="relative mx-auto grid max-w-5xl justify-items-center gap-8 text-center">
        <h2 id="cta-title" className="reveal font-display text-5xl font-bold tracking-tight md:text-7xl">
          Knock once.
          <br />
          <span className="text-primary">The door opens.</span>
        </h2>
        <p className="reveal max-w-[44ch] text-lg leading-relaxed text-muted">Students sign up with their KPM student ID. Lecturer accounts come from the admin office.</p>
        <SessionActions variant="cta" className="reveal justify-center" />
      </div>
    </section>
  );
}
