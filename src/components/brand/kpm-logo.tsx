import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Official Kolej Profesional MARA logo (public/kpmb-logo.png). Never redraw or recolour it.
 * Its lettering is black on transparent, so it always sits on a light plate, in every theme.
 */
export function KpmLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-chip bg-(--logo-plate) p-1.5", className)}>
      <Image src="/kpmb-logo.png" alt="Kolej Profesional MARA" width={1360} height={1212} priority={priority} className="h-full w-auto" />
    </span>
  );
}

/** Logo + product name, for the sidebar and auth screens. */
export function KpmLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <KpmLogo className="h-11" />
      <div className="leading-tight">
        <p className="font-display text-base font-bold tracking-tight text-ink">SCAS</p>
        <p className="text-xs text-muted">KPM Beranang</p>
      </div>
    </div>
  );
}
