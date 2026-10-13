import Image from "next/image";

// Official logo, never redrawn. Its lettering is black on a transparent background,
// so it always sits on a light plate (--plate) to stay visible in dark themes.
export function KpmLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/kpmb-logo.png"
      alt="Kolej Profesional MARA"
      width={1360}
      height={1212}
      className={className}
    />
  );
}

export function KpmLockup({ plateClassName = "" }: { plateClassName?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex rounded-(--radius) bg-(--plate) p-1.5 ${plateClassName}`}>
        <KpmLogo className="h-8 w-auto" />
      </span>
      <span className="leading-tight">
        <span className="font-display block text-sm font-semibold">SCAS</span>
        <span className="block text-xs text-(--muted)">Kolej Profesional MARA Beranang</span>
      </span>
    </div>
  );
}
