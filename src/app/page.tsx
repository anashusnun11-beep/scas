import type { Metadata } from "next";
import Link from "next/link";
import { HeroA } from "@/components/landing/hero-a";
import { LandingShell } from "@/components/landing/landing-shell";
import { SessionActions } from "@/components/landing/session-actions";

export const metadata: Metadata = {
  title: "SCAS | Student Consultation Appointment System, KPM Beranang",
  description: "Book consultation time with your lecturer at KPM Beranang. Pick a slot, get approved, walk in.",
};

// Temporary while the two landing versions are compared: "/" shows version A with a link to B.
export default function Home() {
  return (
    <LandingShell
      hero={<HeroA actions={<SessionActions variant="hero" />} />}
      footerExtra={
        <Link href="/landing/b" className="rounded-chip border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-ink">
          Compare: version B
        </Link>
      }
    />
  );
}
