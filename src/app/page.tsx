import Link from "next/link";
import { KpmLockup } from "@/components/brand/kpm-logo";
import { buttonClasses } from "@/components/ui/button";

// Placeholder until the landing page (module 7).
export default function Home() {
  return (
    <main data-theme="dark" data-stage className="grid min-h-dvh place-items-center bg-canvas px-4 text-ink">
      <div className="grid justify-items-center gap-6 text-center">
        <KpmLockup />
        <h1 className="font-display text-4xl font-bold tracking-tight">Student Consultation Appointment System</h1>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className={buttonClasses({ size: "lg" })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonClasses({ size: "lg", variant: "secondary" })}>
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
