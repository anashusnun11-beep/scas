import Link from "next/link";
import { KpmLockup } from "@/components/brand/kpm-logo";
import { SessionActions } from "./session-actions";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
  { href: "#numbers", label: "Live numbers" },
];

/** Floating bar over the landing page: logo, three anchors, and the session-aware buttons. */
export function LandingNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-(--z-sticky) px-3 sm:px-4">
      <nav
        aria-label="Landing page"
        className="pointer-events-auto mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-card border border-line/80 bg-canvas/75 pl-3 pr-3 shadow-float backdrop-blur-md"
      >
        <Link href="/" aria-label="SCAS home" className="rounded-control">
          <KpmLockup />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <SessionActions variant="nav" className="gap-1 sm:gap-2" />
      </nav>
    </header>
  );
}
