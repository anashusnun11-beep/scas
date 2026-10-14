import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { roleHome, type Role } from "@/lib/navigation";
import { prisma } from "@/server/db";

export type CurrentUser = { id: number; name: string; email: string; role: Role };

/**
 * The signed-in user, re-read from the database on every call so a user who was deactivated
 * (or deleted) mid-session loses access straight away, not when the 30-minute session ends.
 * Reads the session cookie: call it inside a <Suspense> boundary (Cache Components).
 * Wrapped in React cache(): the layout and the page of one request share a single lookup
 * (each new request still reads the database), which saves a round trip on every signed-in page (NFR04).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE") return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/**
 * NFR02: call at the top of every protected page and every server action.
 * - not signed in, or deactivated: to /login (with a reason, so the proxy doesn't bounce back)
 * - wrong role: to that user's own home
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=signed-out");
  if (!roles.includes(user.role)) redirect(roleHome[user.role]);
  return user;
}
