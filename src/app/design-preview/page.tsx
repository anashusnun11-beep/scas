import Link from "next/link";
import { directions } from "./_lib/directions";

export default function DesignPreviewIndex() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-5xl px-4 py-12 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">SCAS: three visual directions</h1>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Each preview shows the landing hero with the office door, the palette and type, and a small sample of the app.
        Pick one and it becomes the design system for every screen.
      </p>

      <ul className="mt-10 grid gap-4">
        {directions.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/design-preview/${d.slug}`}
              className="group grid gap-4 rounded-2xl border border-zinc-200 p-5 transition-colors duration-150 hover:border-zinc-400 md:grid-cols-[1fr_auto] md:items-center dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <div>
                <p className="text-xl font-semibold">
                  {d.number}. {d.name}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{d.tagline}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {d.fonts.display} with {d.fonts.body}. {d.nativeTheme === "dark" ? "Dark first." : "Light first."}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {d.palette.map((c) => (
                    <span key={c.hex} className="h-10 w-8" style={{ background: c.hex }} title={c.name} />
                  ))}
                </div>
                <span className="text-sm font-medium underline-offset-4 group-hover:underline">Open preview</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
