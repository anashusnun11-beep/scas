"use client";

import { ArrowClockwiseIcon, WarningCircleIcon, WifiSlashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Fallback for error.tsx / global-error.tsx: a page or a form action failed in a way the form couldn't
 * explain (lost database connection, timeout, server error). Says what happened and what to do next
 * (DESIGN.md 8.1); the technical details stay in the server log, matched by the error code.
 */
export function ErrorView({
  error,
  retry,
  home = { href: "/", label: "Go to my dashboard" },
  className,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  home?: { href: string; label: string };
  className?: string;
}) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      className={className}
      icon={online ? WarningCircleIcon : WifiSlashIcon}
      title={online ? "Something went wrong" : "You are offline"}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>
            <ArrowClockwiseIcon aria-hidden className="size-4" />
            Try again
          </Button>
          <Link href={home.href} className={buttonClasses({ variant: "secondary" })}>
            {home.label}
          </Link>
        </div>
      }
    >
      {online ? (
        <p>
          This page could not load or save. The connection to the database may have dropped for a moment. Try again,
          and if it keeps happening, tell the admin office.
        </p>
      ) : (
        <p>SCAS needs an internet connection. Check your Wi-Fi or mobile data, then try again.</p>
      )}
      {error.digest && <p className="mt-2 font-mono text-xs">Error code: {error.digest}</p>}
    </EmptyState>
  );
}
