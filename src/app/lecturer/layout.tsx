import { Suspense, type ReactNode } from "react";
import { RoleShell } from "@/components/layout/role-shell";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";

/** Every /lecturer page: LECTURER only (proxy + requireRole). */
export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RoleShell role="LECTURER">{children}</RoleShell>
    </Suspense>
  );
}
