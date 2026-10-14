import type { Metadata } from "next";
import { LimitForm } from "@/components/lecturer/limit-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { cn } from "@/lib/cn";
import { formatSlotDate, formatTimestamp } from "@/lib/dates";
import { requireLecturer } from "@/server/lecturer-context";
import { getLimitSettings, getWeekUsage } from "@/server/services/limits";

export const metadata: Metadata = { title: "Consultation limit | SCAS" };

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const full = used >= max;
  return (
    <div>
      <p className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={cn("font-mono font-semibold", full && "text-danger")}>
          {used} / {max}
        </span>
      </p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used} aria-label={label}>
        <div className={cn("h-full rounded-full", full ? "bg-danger" : "bg-primary")} style={{ width: `${Math.min(100, (used / max) * 100)}%` }} />
      </div>
    </div>
  );
}

/** FR13 Set Consultation Limitation (UI9, SD10), with this week's usage counted like the booking check (BR2). */
export default async function LimitsPage() {
  const { lecturerId } = await requireLecturer();
  const [settings, usage] = await Promise.all([getLimitSettings(lecturerId), getWeekUsage(lecturerId)]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader
          title="Consultation limitation"
          description={
            settings.saved && settings.updatedAt
              ? `Checked automatically on every booking. Last changed ${formatTimestamp(settings.updatedAt)}.`
              : "Checked automatically on every booking."
          }
        />
        <CardBody className="grid gap-5">
          {!settings.saved && <FormMessage tone="info">You have not set limits yet. These are the defaults; save to keep or change them.</FormMessage>}
          {!settings.isEnabled && <FormMessage tone="info">Limits are switched off: students can book any open slot.</FormMessage>}
          <LimitForm
            settings={{
              maxPerDay: settings.maxPerDay,
              maxPerWeek: settings.maxPerWeek,
              maxPerStudentWeek: settings.maxPerStudentWeek,
              sessionDuration: settings.sessionDuration,
              minNoticeHours: settings.minNoticeHours,
              isEnabled: settings.isEnabled,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="This week's usage" description={`Week of ${formatSlotDate(usage.weekStart)}. Pending, approved, rescheduled and completed count.`} />
        <CardBody className="grid gap-5">
          <Meter label="Today" used={usage.today} max={settings.maxPerDay} />
          <Meter label="This week" used={usage.week} max={settings.maxPerWeek} />
          {usage.students.length > 0 ? (
            <ul className="divide-y divide-line">
              {usage.students.map((s) => (
                <li key={s.studentId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="font-mono text-xs text-muted">{s.studentId}</span>
                  </span>
                  <span className={cn("font-mono font-semibold", s.count >= settings.maxPerStudentWeek && "text-danger")}>
                    {s.count} / {settings.maxPerStudentWeek}
                    {s.count >= settings.maxPerStudentWeek && <span className="ml-2 font-sans text-xs">limit</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No bookings this week yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
