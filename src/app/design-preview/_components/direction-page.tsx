import type { ReactNode } from "react";
import type { Direction } from "../_lib/directions";
import { AppSample } from "./app-sample";
import { KpmLockup } from "./kpm-logo";
import { PreviewFrame } from "./preview-frame";

const HEADLINE: Record<Direction["slug"], string> = {
  koridor: "text-4xl font-semibold tracking-tight md:text-6xl leading-[1.05]",
  papan: "text-5xl font-black uppercase leading-[0.95] md:text-7xl [font-stretch:125%]",
  lampu: "text-4xl font-bold tracking-tight md:text-6xl leading-[1.05]",
};

export function DirectionPage({
  direction,
  fontClassName,
  door,
}: {
  direction: Direction;
  fontClassName: string;
  door: ReactNode;
}) {
  const isPapan = direction.slug === "papan";

  return (
    <PreviewFrame slug={direction.slug} nativeTheme={direction.nativeTheme} fontClassName={fontClassName}>
      {/* landing / login hero: the big moment */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 md:py-16 lg:grid-cols-[1fr_1fr]">
        <div className="max-w-xl">
          <KpmLockup />
          <h1 className={`font-display mt-10 ${HEADLINE[direction.slug]}`}>
            Knock once.
            <br />
            <span className={direction.slug === "lampu" ? "text-(--primary)" : ""}>The door opens.</span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-(--muted)">
            Book a consultation with your lecturer, see open slots and track every appointment in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className={`rounded-(--radius) bg-(--primary) px-6 py-3 font-semibold text-(--on-primary) transition-transform duration-100 active:scale-[0.97] ${isPapan ? "uppercase" : ""}`}
            >
              Log in
            </button>
            <button
              type="button"
              className={`rounded-(--radius) px-6 py-3 font-semibold transition-colors duration-150 hover:bg-(--surface-2) ${
                isPapan ? "border-2 border-(--line) uppercase" : "border border-(--line)"
              }`}
            >
              Create account
            </button>
          </div>
        </div>
        <div className="flex justify-center">{door}</div>
      </section>

      {/* direction notes + app sample */}
      <section className="mx-auto grid max-w-7xl gap-10 border-t border-(--line) px-4 py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-8">
          <div>
            <h2 className="font-display text-3xl font-bold">
              {direction.number}. {direction.name}
            </h2>
            <p className="mt-1 text-(--muted)">{direction.tagline}</p>
            <p className="mt-4 leading-relaxed">{direction.mood}</p>
          </div>

          <div>
            <h3 className="font-display font-semibold">Palette</h3>
            <ul className="mt-3 grid gap-2">
              {direction.palette.map((c) => (
                <li key={c.hex} className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 shrink-0 rounded-(--radius) border border-(--line)"
                    style={{ background: c.hex }}
                  />
                  <span className="text-sm leading-tight">
                    <span className="font-semibold">{c.name}</span>{" "}
                    <span className="font-mono-dp text-xs text-(--muted)">{c.hex}</span>
                    <span className="block text-xs text-(--muted)">{c.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold">Type</h3>
            <p className={`font-display mt-2 text-5xl font-bold ${isPapan ? "[font-stretch:125%]" : ""}`}>Aa Gg 10:30</p>
            <p className="mt-2 text-sm text-(--muted)">
              Headings: {direction.fonts.display}. Body: {direction.fonts.body}.
              {direction.fonts.mono ? ` Times and IDs: ${direction.fonts.mono}.` : ""}
            </p>
            <p className="mt-3 leading-relaxed">
              Your appointment on Tuesday, 20 October at 10:00 has been approved. Please arrive five minutes early.
            </p>
          </div>

          <dl className="grid gap-4 text-sm leading-relaxed">
            <div>
              <dt className="font-display font-semibold">Motion</dt>
              <dd className="mt-1 text-(--muted)">{direction.motion}</dd>
            </div>
            <div>
              <dt className="font-display font-semibold">The door</dt>
              <dd className="mt-1 text-(--muted)">{direction.door}</dd>
            </div>
            <div>
              <dt className="font-display font-semibold">Inside the app</dt>
              <dd className="mt-1 text-(--muted)">{direction.appFeel}</dd>
            </div>
            <div>
              <dt className="font-display font-semibold">Trade-off</dt>
              <dd className="mt-1 text-(--muted)">{direction.tradeOff}</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0">
          <h2 className="font-display mb-4 text-xl font-semibold">How the app would feel</h2>
          <AppSample slug={direction.slug} />
        </div>
      </section>
    </PreviewFrame>
  );
}
