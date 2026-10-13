import { Suspense, type ReactNode } from "react";
import { RoleShell } from "@/components/layout/role-shell";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

/** Every /admin page: ADMIN only (proxy + requireRole). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RoleShell role="ADMIN">{children}</RoleShell>
    </Suspense>
  );
}
