import { CalendarCheckIcon, DoorOpenIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { KpmLogo } from "@/components/brand/kpm-logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { FlipOnView } from "./flip-on-view";

/**
 * The three real steps of a consultation, each with a small preview built from the app's own
 * components (light, the way they look inside SCAS). Previews are illustrations: inert and hidden
 * from screen readers; the step text says the same thing.
 */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 px-4 py-28 lg:px-8 lg:py-40">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 id="how-title" className="reveal font-display text-4xl font-bold tracking-tight md:text-5xl">
            Three steps from the corridor to the chair.
          </h2>
          <p className="reveal mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
            No more waiting outside a closed door. Your lecturer publishes office hours, you book one, and the slip tells you when to walk in.
          </p>
        </div>

        <ol className="grid gap-16 lg:gap-24">
          <Step
            icon={CalendarCheckIcon}
            title="Pick a slot"
            body="See your assigned lecturer's open office hours for the next four weeks. Booked times are crossed out, so you never knock on a busy door."
            preview={<SlotsPreview />}
          />
          <Step
            icon={PaperPlaneTiltIcon}
            title="Send the request"
            body="Say what you want to discuss. Your lecturer approves it, or suggests another time, and you see the status change straight away."
            preview={<RequestPreview />}
          />
          <Step
            icon={DoorOpenIcon}
            title="Walk in approved"
            body="Print the appointment slip or keep it on your phone. After the meeting your lecturer records notes, so both of you remember what was agreed."
            preview={<SlipPreview />}
          />
        </ol>
      </div>
    </section>
  );
}

function Step({ icon: IconComponent, title, body, preview }: { icon: Icon; title: string; body: string; preview: ReactNode }) {
  return (
    <li className="reveal grid gap-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-primary/15 text-primary">
          <IconComponent aria-hidden className="size-5" weight="bold" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      <Screen>{preview}</Screen>
    </li>
  );
}

/** A lamp-lit pane of the light app UI sitting in the dark corridor. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      inert
      className={cn(
        "relative overflow-hidden rounded-card border border-line-strong/60 p-1.5 shadow-float",
        "bg-[radial-gradient(120%_120%_at_85%_0%,color-mix(in_oklab,var(--lamp)_28%,transparent),transparent_60%)]",
        className,
      )}
    >
      <div data-theme="light" className="h-full rounded-[12px] bg-canvas p-4 text-ink sm:p-5">
        {children}
      </div>
    </div>
  );
}

const slots = [
  { day: "Mon, 19 Oct", time: "10:00 - 10:30", note: "Room B2.14" },
  { day: "Tue, 20 Oct", time: "10:00 - 10:30", note: "Booked", booked: true },
  { day: "Wed, 21 Oct", time: "14:30 - 15:00", note: "Room B2.14", picked: true },
  { day: "Thu, 22 Oct", time: "10:00 - 10:30", note: "Room B2.14" },
  { day: "Fri, 23 Oct", time: "11:00 - 11:30", note: "Booked", booked: true },
  { day: "Fri, 23 Oct", time: "15:30 - 16:00", note: "Room B2.14" },
];

function SlotsPreview() {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold">Dr. Nurul Huda binti Ismail, open slots</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((s) => (
          <li
            key={s.day + s.time}
            className={cn(
              "rounded-control border px-3 py-2.5",
              s.booked ? "border-line bg-surface-2 text-muted" : "border-line bg-surface",
              s.picked && "border-primary ring-4 ring-primary/20",
            )}
          >
            <span className="block text-xs font-semibold text-muted">{s.day}</span>
            <span className={cn("block font-mono text-sm font-semibold", s.booked && "line-through")}>{s.time}</span>
            <span className="block truncate text-xs text-muted">{s.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="font-semibold">Review chapter 3 of the project report</p>
        <p className="font-mono text-xs text-muted">APT-0012 Wed, 21 Oct, 14:30 - 15:00</p>
        <p className="mt-1 text-sm text-muted">Dr. Nurul Huda binti Ismail, Room B2.14</p>
      </div>
      <span className="justify-self-start">
        <FlipOnView from="PENDING" to="APPROVED" />
      </span>
    </div>
  );
}

function SlipPreview() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-3">
          <KpmLogo className="h-10 p-0" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">Appointment slip</p>
            <p className="text-xs text-muted">SCAS, KPM Beranang</p>
          </div>
        </div>
        <p className="font-mono text-sm font-bold">APT-0012</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {[
          ["Student", "Aina Sofea binti Rahman"],
          ["Lecturer", "Dr. Nurul Huda binti Ismail"],
          ["When", "Wed, 21 Oct, 14:30"],
          ["Where", "Room B2.14"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="truncate font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <StatusBadge status="APPROVED" className="justify-self-start" />
    </div>
  );
}
