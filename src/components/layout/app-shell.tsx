"use client";

import {
  CalendarCheckIcon,
  CalendarDotsIcon,
  CalendarPlusIcon,
  ChalkboardTeacherIcon,
  ChartBarIcon,
  ClockCounterClockwiseIcon,
  GaugeIcon,
  ListChecksIcon,
  ListIcon,
  SquaresFourIcon,
  StudentIcon,
  TrayIcon,
  UserCircleIcon,
  UsersThreeIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { KpmLockup } from "@/components/brand/kpm-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import { variants } from "@/lib/motion";
import { navigation, roleLabel, type NavIcon, type Role } from "@/lib/navigation";

const icons: Record<NavIcon, Icon> = {
  dashboard: SquaresFourIcon,
  lecturer: ChalkboardTeacherIcon,
  book: CalendarPlusIcon,
  status: ListChecksIcon,
  history: ClockCounterClockwiseIcon,
  profile: UserCircleIcon,
  requests: TrayIcon,
  appointments: CalendarCheckIcon,
  slots: CalendarDotsIcon,
  limits: GaugeIcon,
  students: StudentIcon,
  lecturers: UsersThreeIcon,
  reports: ChartBarIcon,
};

function initials(name: string) {
  const words = name.replace(/^(Dr\.|En\.|Pn\.|Prof\.)\s+/i, "").split(/\s+/);
  return (words[0]?.[0] ?? "") + (words.find((w, i) => i > 0 && !/^(bin|binti|a\/l|a\/p)$/i.test(w))?.[0] ?? "");
}

function isActive(pathname: string, href: string, home: string) {
  return href === home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ role, footer, onNavigate }: { role: Role; footer?: ReactNode; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navigation[role];
  const home = items[0].href;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <KpmLockup />
      </div>
      <nav aria-label={`${roleLabel[role]} menu`} className="flex-1 overflow-y-auto px-3">
        <ul className="grid gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href, home);
            const ItemIcon = icons[item.icon];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150",
                    active ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink",
                  )}
                >
                  {active && <span aria-hidden className="absolute inset-y-2.5 left-0 w-1 rounded-full bg-primary" />}
                  <ItemIcon aria-hidden weight={active ? "fill" : "regular"} className={cn("size-5", active && "text-primary")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {footer && <div className="border-t border-line p-3">{footer}</div>}
    </div>
  );
}

/**
 * Layout for every signed-in page. The sidebar is always dark (navy) and the content area follows
 * the user's theme (light by default). On small screens the sidebar becomes a drawer.
 */
export function AppShell({
  role,
  user,
  title,
  footer,
  children,
}: {
  role: Role;
  user: { name: string };
  /** Defaults to the label of the active menu item. */
  title?: string;
  /** Bottom of the sidebar, e.g. the logout form (module 2). */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navigation[role];
  const pageTitle = title ?? items.find((i) => isActive(pathname, i.href, items[0].href))?.label ?? "SCAS";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:pl-(--sidebar-width) print:bg-white print:pl-0">
      {/* desktop sidebar */}
      <aside
        data-theme="dark"
        className="fixed inset-y-0 left-0 z-(--z-sidebar) hidden w-(--sidebar-width) border-r border-line bg-canvas text-ink lg:block print:hidden"
      >
        <SidebarContent role={role} footer={footer} />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="scrim"
              {...variants.scrim}
              className="fixed inset-0 z-(--z-overlay) bg-(--scrim) lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              key="drawer"
              {...variants.drawer}
              data-theme="dark"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-(--z-drawer) w-[min(85vw,var(--sidebar-width))] bg-canvas text-ink shadow-float lg:hidden"
            >
              <button
                type="button"
                autoFocus
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-5 grid size-10 place-items-center rounded-control text-muted hover:bg-surface-2 hover:text-ink"
              >
                <XIcon aria-hidden className="size-5" />
              </button>
              <SidebarContent role={role} footer={footer} onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-(--z-sticky) flex h-(--topbar-height) items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur lg:px-8 print:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="-ml-2 grid size-10 place-items-center rounded-control text-ink hover:bg-surface-2 lg:hidden"
        >
          <ListIcon aria-hidden className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-display text-heading font-semibold">{pageTitle}</h1>
        <ThemeToggle />
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{roleLabel[role]}</p>
          </div>
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full bg-primary font-display text-sm font-bold uppercase text-on-primary"
          >
            {initials(user.name)}
          </span>
        </div>
      </header>

      {/* key restarts the CSS enter animation on every route change */}
      <main key={pathname} className="mx-auto w-full max-w-6xl animate-page-enter px-4 py-6 lg:px-8 lg:py-8 print:max-w-none print:animate-none print:p-0">
        {children}
      </main>
    </div>
  );
}
