import type { Metadata } from "next";
import { HeroA } from "@/components/landing/hero-a";
import { LandingShell } from "@/components/landing/landing-shell";
import { SessionActions } from "@/components/landing/session-actions";

export const metadata: Metadata = {
  title: "SCAS | Student Consultation Appointment System, KPM Beranang",
  description: "Book consultation time with your lecturer at KPM Beranang. Pick a slot, get approved, walk in.",
};

/** Landing version A: GSAP ScrollTrigger + the React Three Fiber door. */
export default function LandingA() {
  return <LandingShell hero={<HeroA actions={<SessionActions variant="hero" />} />} />;
}
