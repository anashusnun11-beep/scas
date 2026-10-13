import Link from "next/link";
import type { ReactNode } from "react";
import { KpmLockup } from "@/components/brand/kpm-logo";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { duration, ease, splitFlap } from "@/lib/motion";
import { ButtonsDemo, FormDemo, SignDemo, StatusDemo, ToastDemo } from "./_components/demos";

const SEMANTIC = [
  { token: "canvas", use: "Page background", light: "#F3F3F7", dark: "#0A0D1A" },
  { token: "surface", use: "Cards, inputs", light: "#FDFDFE", dark: "#121731" },
  { token: "surface-2", use: "Hover, subtle fills", light: "#E8E8F0", dark: "#1A2042" },
  { token: "ink", use: "Text", light: "#12162B", dark: "#EEF0F7" },
  { token: "muted", use: "Secondary text", light: "#545A73", dark: "#9AA1BE" },
  { token: "line", use: "Borders", light: "#D9DAE4", dark: "#262D52" },
  { token: "primary", use: "Actions (lamp amber)", light: "#F5A524", dark: "#FFB547" },
  { token: "accent-ink", use: "Amber as text", light: "#7A4700", dark: "#FFCF85" },
  { token: "danger", use: "Destructive, errors", light: "#B42318", dark: "#F87171" },
  { token: "sign-stop", use: "SILA KETUK", light: "#C8202A", dark: "#F0525A" },
  { token: "sign-go", use: "SILA MASUK", light: "#1B7A43", dark: "#3DD68C" },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="grid gap-5 border-t border-line py-10">
      <div>
        <h2 className="font-display text-title font-bold">{title}</h2>
        {description && <p className="mt-2 max-w-[65ch] text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function TokenPanel({ theme }: { theme: "light" | "dark" }) {
  return (
    <div data-theme={theme} className="rounded-card border border-line bg-canvas p-5 text-ink">
      <p className="font-display text-subheading font-semibold capitalize">{theme}</p>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {SEMANTIC.map((t) => (
          <li key={t.token} className="flex items-center gap-3">
            <span className="size-9 shrink-0 rounded-chip border border-line" style={{ background: `var(--${t.token})` }} />
            <span className="min-w-0 text-sm leading-tight">
              <span className="font-mono font-semibold">{t.token}</span>{" "}
              <span className="font-mono text-xs text-muted">{theme === "light" ? t.light : t.dark}</span>
              <span className="block text-xs text-muted">{t.use}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/design-preview" className="text-sm text-muted hover:text-ink">
            Directions
          </Link>
          <p className="font-display font-semibold">SCAS design system</p>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 py-12 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <KpmLockup />
            <h1 className="mt-8 font-display text-4xl font-bold tracking-tight md:text-display">Lampu Pejabat</h1>
            <p className="mt-4 max-w-[60ch] text-lg text-muted">
              Night navy and lamp amber, with the split-flap sign from Papan Tanda. Light by default inside the app, dark on
              the landing page and login. Everything here is documented in DESIGN.md.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/design-preview/system/shell/student" className={buttonClasses()}>
              Open the AppShell
            </Link>
          </div>
        </div>

        <Section id="colour" title="Colour" description="Semantic tokens swap per theme. Components only use these, never raw hex. Use the moon button to flip the whole page.">
          <div className="grid gap-4 lg:grid-cols-2">
            <TokenPanel theme="light" />
            <TokenPanel theme="dark" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-theme="light" className="flex flex-wrap gap-2 rounded-card border border-line bg-surface p-4">
              {(["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "CANCELLED", "COMPLETED"] as const).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <div data-theme="dark" className="flex flex-wrap gap-2 rounded-card border border-line bg-surface p-4">
              {(["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "CANCELLED", "COMPLETED"] as const).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="type" title="Type" description="Bricolage Grotesque for headings, Manrope for reading, JetBrains Mono for times, IDs and the split-flap.">
          <div className="grid gap-5">
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">display 60/1.05</span>
              <p className="font-display text-4xl font-bold md:text-display">Knock once.</p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">title 30/1.2</span>
              <p className="font-display text-title font-bold">Booking requests</p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">heading 20/1.3</span>
              <p className="font-display text-heading font-semibold">Your lecturer</p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">subheading 17/1.4</span>
              <p className="font-display text-subheading font-semibold">Open slots next week</p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">body 16/1.6</span>
              <p className="max-w-[65ch] leading-relaxed">
                Your appointment on Tuesday, 20 October at 10:00 has been approved. Please arrive five minutes early and bring the
                printed slip.
              </p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">small 14 / caption 12</span>
              <p className="text-sm text-muted">
                Helper text and table cells. <span className="text-xs">Captions never go below 12 px.</span>
              </p>
            </div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-muted">mono</span>
              <p className="font-mono">APT-0012 2023110987 10:00 - 10:30</p>
            </div>
          </div>
        </Section>

        <Section id="shape" title="Shape and elevation" description="Three radii, locked: cards 16, controls 12, chips and badges 8. Shadows are tinted navy, never pure black.">
          <div className="flex flex-wrap items-end gap-6">
            <div className="grid size-28 place-items-center rounded-card border border-line bg-surface text-sm shadow-card">card 16</div>
            <div className="grid h-11 w-32 place-items-center rounded-control border border-line bg-surface text-sm">control 12</div>
            <div className="grid h-7 w-24 place-items-center rounded-chip border border-line bg-surface text-xs">chip 8</div>
            <div className="grid size-28 place-items-center rounded-card bg-surface text-sm shadow-float">float</div>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" description="One primary per view. Press feedback is a 0.97 scale, removed under reduced motion. Loading keeps the label so the width never jumps.">
          <ButtonsDemo />
        </Section>

        <Section id="forms" title="Form fields" description="Label above, hint and error below, error linked with aria-describedby. Try submitting with a short purpose.">
          <Card>
            <CardBody>
              <FormDemo />
            </CardBody>
          </Card>
        </Section>

        <Section id="card" title="Card">
          <Card className="max-w-md">
            <CardHeader title="Your lecturer" description="Assigned by the admin" />
            <CardBody className="grid gap-1 text-sm">
              <p className="font-display text-subheading font-semibold">Dr. Nurul Huda binti Ismail</p>
              <p className="text-muted">Senior Lecturer, Computer Science</p>
              <p className="mt-2">Block B, Level 2, Room 2.14</p>
              <p className="font-mono">03-8925 1214</p>
            </CardBody>
            <CardFooter>
              <Link href="#card" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                View open slots
              </Link>
            </CardFooter>
          </Card>
        </Section>

        <Section
          id="status"
          title="Status badge with split-flap"
          description="When a status changes on screen the letters flip to the new word, small and fast (about 300 ms). Colour always comes with the word, never alone."
        >
          <StatusDemo />
        </Section>

        <Section id="sign" title="Door sign" description="The same split-flap at stage speed, for the landing page and login. Always on a dark stage.">
          <SignDemo />
        </Section>

        <Section id="toast" title="Toast" description="Bottom right on desktop, full width on phones. Errors stay 8 s and are announced as alerts.">
          <ToastDemo />
        </Section>

        <Section id="motion" title="Motion presets" description="From src/lib/motion.ts. App lane stays under 250 ms. The 1.6 s door is for the landing page and login only.">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader title="Durations" />
              <CardBody>
                <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 font-mono text-sm">
                  {Object.entries(duration).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted">{k}</dt>
                      <dd>{Math.round(v * 1000)} ms</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Easing" />
              <CardBody>
                <dl className="grid gap-1.5 font-mono text-sm">
                  {Object.entries(ease).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd>[{v.join(", ")}]</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Split-flap" />
              <CardBody>
                <dl className="grid gap-1.5 font-mono text-sm">
                  {Object.entries(splitFlap).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd>
                        {v.tickMs} ms tick, {v.baseTicks}+{v.ticksPerCell}/cell
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section id="shell" title="AppShell" description="Navy sidebar (always dark), light content by default, drawer on phones. Open it per role:">
          <div className="flex flex-wrap gap-3">
            <Link href="/design-preview/system/shell/student" className={buttonClasses({ variant: "secondary" })}>
              Student
            </Link>
            <Link href="/design-preview/system/shell/lecturer" className={buttonClasses({ variant: "secondary" })}>
              Lecturer
            </Link>
            <Link href="/design-preview/system/shell/admin" className={buttonClasses({ variant: "secondary" })}>
              Admin
            </Link>
          </div>
        </Section>
      </main>
    </div>
  );
}
