import type { ReactNode } from "react";
import { FinalCta } from "./final-cta";
import { HowItWorks } from "./how-it-works";
import { LandingNav } from "./landing-nav";
import { LiveNumbers } from "./live-numbers";
import { RoleSections } from "./role-sections";
import { SiteFooter } from "./site-footer";

/**
 * The landing page around a hero (DESIGN.md section 9): always dark, the "big moment" stage.
 * Every version shares the sections below the hero.
 */
export function LandingShell({ hero, footerExtra }: { hero: ReactNode; footerExtra?: ReactNode }) {
  return (
    <div data-theme="dark" data-stage className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <a href="#how" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Skip the introduction
      </a>
      <LandingNav />
      <main>
        {hero}
        <HowItWorks />
        <RoleSections />
        <LiveNumbers />
        <FinalCta />
      </main>
      <SiteFooter extra={footerExtra} />
    </div>
  );
}
