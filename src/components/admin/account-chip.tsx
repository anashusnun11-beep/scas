import type { CSSProperties } from "react";

/** ACTIVE / INACTIVE account chip, same tint rule as the status badge. Usable on the server and the client. */
export function AccountChip({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return (
    <span
      className="status-badge inline-flex rounded-chip px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide"
      style={{ "--st": status === "ACTIVE" ? "var(--st-approved)" : "var(--st-cancelled)" } as CSSProperties}
    >
      {status}
    </span>
  );
}
