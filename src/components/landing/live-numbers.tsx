import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { getLandingStats } from "@/server/queries/landing";

/** Real counts from the SCAS database (cached for a few minutes), counting up once on first view. */
export function LiveNumbers() {
  return (
    <section id="numbers" aria-labelledby="numbers-title" className="scroll-mt-24 border-y border-line bg-[linear-gradient(180deg,var(--canvas),var(--surface))] px-4 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 id="numbers-title" className="reveal max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
          The corridor, right now.
        </h2>
        <p className="reveal mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">Counted live from the SCAS database at KPM Beranang, refreshed every few minutes.</p>
        <Suspense fallback={<NumbersGrid stats={null} />}>
          <Numbers />
        </Suspense>
      </div>
    </section>
  );
}

async function Numbers() {
  return <NumbersGrid stats={await getLandingStats()} />;
}

function NumbersGrid({ stats }: { stats: Awaited<ReturnType<typeof getLandingStats>> | null }) {
  const items = [
    { label: "Consultations this month", hint: "Booked, approved or done", value: stats?.consultationsThisMonth },
    { label: "Lecturers taking bookings", hint: "Active accounts", value: stats?.activeLecturers },
    { label: "Open slots this week", hint: "From today to Sunday", value: stats?.openSlotsThisWeek },
    { label: "Students signed up", hint: "Active accounts", value: stats?.students },
  ];
  return (
    <dl className="mt-14 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn("reveal flex flex-col", i % 2 === 1 && "border-l border-line pl-5 lg:pl-8", i === 2 && "lg:border-l lg:border-line lg:pl-8")}
        >
          <dt className="order-2 mt-2 text-sm font-semibold text-ink">{item.label}</dt>
          <dd className="order-1 font-display text-6xl font-bold tracking-tight text-primary lg:text-7xl">
            {item.value === undefined ? <span className="inline-block h-[1em] w-16 rounded-control bg-surface-2 align-middle" aria-label="Loading" /> : <AnimatedNumber value={item.value} />}
          </dd>
          <dd className="order-3 mt-1 text-sm text-muted">{item.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
