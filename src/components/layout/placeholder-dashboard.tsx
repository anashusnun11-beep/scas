import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { roleLabel, type Role } from "@/lib/navigation";

/** Temporary dashboard until each role's module is built. Checks the role itself (every page does). */
export async function PlaceholderDashboard({ role, module }: { role: Role; module: string }) {
  const user = await requireRole(role);
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-muted">{roleLabel[role]}</p>
        <h2 className="font-display text-title font-bold">Welcome, {user.name}</h2>
      </div>
      <Card>
        <CardHeader title="Your dashboard is on its way" description={`It arrives in ${module}.`} />
        <CardBody className="text-sm text-muted">
          You are signed in as {user.email}. For your security you are signed out after 30 minutes without activity.
        </CardBody>
      </Card>
    </div>
  );
}
