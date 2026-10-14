"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

/** Log in / Sign up switch (UI1). Two URLs, so each screen can be linked and the door stays put. */
export function AuthTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="grid grid-cols-2 gap-1 rounded-control border border-line bg-surface p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            // No prefetch: right after a login the router re-prefetches visible links, the proxy sends a
            // signed-in user away from /login and /signup, and that redirected prefetch 404s in the console.
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "grid h-10 place-items-center rounded-[9px] text-sm font-semibold transition-colors duration-150",
              active ? "bg-primary text-on-primary" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
