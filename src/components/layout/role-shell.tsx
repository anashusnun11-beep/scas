import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guard";
import type { Role } from "@/lib/navigation";
import { AppShell } from "./app-shell";
import { LogoutButton } from "./logout-button";

/**
 * Signed-in frame for one role: checks the role (NFR02), then renders the AppShell.
 * Reads the session, so the role layouts render it inside <Suspense>.
 */
export async function RoleShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = await requireRole(role);
  return (
    <AppShell role={role} user={{ name: user.name }} footer={<LogoutButton />}>
      {children}
    </AppShell>
  );
}
