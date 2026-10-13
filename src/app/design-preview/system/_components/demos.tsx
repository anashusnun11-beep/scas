"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SplitFlap } from "@/components/ui/split-flap";
import { APPOINTMENT_STATUSES, StatusBadge, type AppointmentStatus } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export function ButtonsDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Submit booking</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">View details</Button>
        <Button variant="danger">Reject</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1600);
          }}
        >
          {loading ? "Saving" : "Click to load"}
        </Button>
      </div>
    </div>
  );
}

export function StatusDemo() {
  const [index, setIndex] = useState(0);
  const status = APPOINTMENT_STATUSES[index];
  const [row, setRow] = useState<AppointmentStatus>("PENDING");

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {APPOINTMENT_STATUSES.map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        <Button size="sm" variant="secondary" onClick={() => setIndex((index + 1) % APPOINTMENT_STATUSES.length)}>
          Next status
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-canvas p-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">APT-0012</p>
          <p className="truncate text-sm text-muted">FYP proposal discussion, Tue 20 Oct, 10:00</p>
        </div>
        <StatusBadge status={row} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setRow("APPROVED")}>
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => setRow("REJECTED")}>
          Reject
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRow("PENDING")}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function SignDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div data-theme="dark" className="grid justify-items-start gap-4 rounded-card bg-canvas p-6 text-ink">
      <div className="flex items-center gap-3 font-mono text-2xl font-bold">
        <span className="text-sm text-muted">SILA</span>
        <span className="relative">
          <SplitFlap value={open ? "MASUK" : "KETUK"} speed="sign" variant="board" />
          <span aria-hidden className={`absolute -bottom-2 inset-x-0 h-1 rounded-full transition-colors duration-300 ${open ? "bg-sign-go" : "bg-sign-stop"}`} />
        </span>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
        {open ? "Close the door" : "Knock"}
      </Button>
    </div>
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "success", title: "Booking submitted", description: "Tue, 20 Oct at 10:00 is now PENDING." })}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "error", title: "Slot already taken", description: "Please choose another slot." })}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "info", title: "Limit reached this week", description: "Dr. Nurul Huda accepts 2 bookings per student per week." })}
      >
        Info
      </Button>
    </div>
  );
}

export function FormDemo() {
  const { toast } = useToast();
  const [error, setError] = useState<string | undefined>();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const purpose = String(new FormData(e.currentTarget).get("purpose") ?? "").trim();
    if (purpose.length < 10) {
      setError("Tell your lecturer what the consultation is about (at least 10 characters).");
      return;
    }
    setError(undefined);
    toast({ tone: "success", title: "Looks good", description: "This is only a demo, nothing was saved." });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 md:grid-cols-2">
      <Field id="demo-student-id" label="Student ID" required hint="The ID on your matric card.">
        <Input name="studentId" defaultValue="2023110987" inputMode="numeric" />
      </Field>
      <Field id="demo-slot" label="Slot" required>
        <Select name="slot" defaultValue="1">
          <option value="1">Mon, 19 Oct, 10:00 - 10:30</option>
          <option value="3">Wed, 21 Oct, 10:00 - 10:30</option>
          <option value="4">Thu, 22 Oct, 10:00 - 10:30</option>
        </Select>
      </Field>
      <Field id="demo-purpose" label="Purpose of consultation" required error={error} className="md:col-span-2">
        <Textarea name="purpose" placeholder="e.g. Discuss my final year project scope" />
      </Field>
      <Field id="demo-disabled" label="Lecturer" hint="Set by the admin.">
        <Input defaultValue="Dr. Nurul Huda binti Ismail" disabled />
      </Field>
      <div className="flex items-end justify-end gap-3">
        <Button variant="secondary" type="reset" onClick={() => setError(undefined)}>
          Clear
        </Button>
        <Button type="submit">Submit booking</Button>
      </div>
    </form>
  );
}
