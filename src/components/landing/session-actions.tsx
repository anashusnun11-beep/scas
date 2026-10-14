import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonClasses, type ButtonSize } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guard";
import { cn } from "@/lib/cn";
import { roleHome } from "@/lib/navigation";

type Variant = "nav" | "hero" | "cta";

const size: Record<Variant, ButtonSize> = { nav: "sm", hero: "lg", cta: "lg" };

/**
 * Log in / Sign up for visitors, "Go to dashboard" for someone already signed in.
 * Reads the session, so it streams in inside <Suspense> (Cache Components); the fallback keeps
 * the same footprint so nothing jumps.
 */
export function SessionActions({ variant, className }: { variant: Variant; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Suspense fallback={<Placeholder variant={variant} />}>
        <Actions variant={variant} />
      </Suspense>
    </div>
  );
}

async function Actions({ variant }: { variant: Variant }) {
  // Per request: the rest of the landing page is prerendered, only these buttons depend on the session.
  await connection();
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href={roleHome[user.role]} className={buttonClasses({ size: size[variant] })}>
        Go to dashboard
        <ArrowRightIcon aria-hidden className="size-4" weight="bold" />
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className={buttonClasses({ size: size[variant] })}>
        Log in
      </Link>
      <Link href="/signup" className={buttonClasses({ size: size[variant], variant: variant === "nav" ? "ghost" : "secondary" })}>
        Sign up
      </Link>
    </>
  );
}

function Placeholder({ variant }: { variant: Variant }) {
  const h = variant === "nav" ? "h-9" : "h-12";
  return (
    <>
      <span aria-hidden className={cn(h, "w-24 rounded-control bg-surface-2/60")} />
      <span aria-hidden className={cn(h, "w-24 rounded-control bg-surface-2/30")} />
    </>
  );
}
