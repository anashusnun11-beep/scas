import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingShell } from "@/components/landing/landing-shell";
import { SessionActions } from "@/components/landing/session-actions";

export const metadata: Metadata = {
  title: "SCAS | Student Consultation Appointment System, KPM Beranang",
  description: "Book consultation time with your lecturer at KPM Beranang. Pick a slot, get approved, walk in.",
};

/** Landing page (spec section 11, "Knock once. The door opens."): the scroll-driven door, then the shared sections. */
export default function Home() {
  return <LandingShell hero={<LandingHero actions={<SessionActions variant="hero" />} />} />;
}
