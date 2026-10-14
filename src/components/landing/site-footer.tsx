import Link from "next/link";
import type { ReactNode } from "react";
import { KpmLogo } from "@/components/brand/kpm-logo";

/** Footer: logo, product name, campus, and who built it. `extra` holds the temporary version-compare link. */
export function SiteFooter({ extra }: { extra?: ReactNode }) {
  return (
    <footer className="border-t border-line px-4 py-12 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="flex items-start gap-4">
          <KpmLogo className="h-14" />
          <div className="grid gap-1">
            <p className="font-display text-lg font-bold">SCAS, Student Consultation Appointment System</p>
            <p className="text-sm text-muted">Kolej Profesional MARA Beranang</p>
            <p className="text-sm text-muted">Diploma in Computer Science final project, Muhammad Anas bin Husnun</p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/login" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            Log in
          </Link>
          <Link href="/signup" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            Sign up
          </Link>
          {extra}
        </nav>
      </div>
    </footer>
  );
}
