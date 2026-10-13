"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { directions, type DirectionSlug } from "../_lib/directions";

type Theme = "light" | "dark";

export function PreviewFrame({
  slug,
  nativeTheme,
  fontClassName,
  children,
}: {
  slug: DirectionSlug;
  nativeTheme: Theme;
  fontClassName: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(nativeTheme);

  return (
    <div data-theme={theme} className={`dp dir-${slug} ${fontClassName} min-h-[100dvh]`}>
      <header className="sticky top-0 z-30 border-b border-(--line) bg-(--bg)/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/design-preview" className="whitespace-nowrap text-sm text-(--muted) hover:text-(--ink)">
            All<span className="hidden sm:inline"> directions</span>
          </Link>
          <nav aria-label="Design directions" className="flex gap-1 overflow-x-auto">
            {directions.map((d) => (
              <Link
                key={d.slug}
                href={`/design-preview/${d.slug}`}
                aria-current={d.slug === slug ? "page" : undefined}
                className={`whitespace-nowrap rounded-(--radius) px-3 py-1.5 text-sm transition-colors duration-150 ${
                  d.slug === slug
                    ? "bg-(--primary) text-(--on-primary)"
                    : "text-(--muted) hover:bg-(--surface-2) hover:text-(--ink)"
                }`}
              >
                <span className="hidden sm:inline">
                  {d.number}. {d.name}
                </span>
                <span className="sm:hidden">{d.name.split(" ")[0]}</span>
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="whitespace-nowrap rounded-(--radius) border border-(--line) px-3 py-1.5 text-sm hover:bg-(--surface-2)"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
