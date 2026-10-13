import { Suspense, type ReactNode } from "react";
import { RoleShell } from "@/components/layout/role-shell";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

/** Every /student page: STUDENT only (proxy + requireRole). */
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RoleShell role="STUDENT">{children}</RoleShell>
    </Suspense>
  );
}
