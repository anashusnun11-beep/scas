import type { NextAuthConfig } from "next-auth";
import { roleHome, type Role } from "@/lib/navigation";

/** NFR01: the session ends after 30 minutes without activity. */
export const SESSION_IDLE_SECONDS = 30 * 60;

const AREA: Record<string, Role> = { "/student": "STUDENT", "/lecturer": "LECTURER", "/admin": "ADMIN" };

function areaFor(pathname: string): Role | undefined {
  const prefix = Object.keys(AREA).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  return prefix ? AREA[prefix] : undefined;
}

/**
 * Light config shared by the proxy and the full Auth.js setup. No Prisma or bcrypt here,
 * so the proxy stays fast. The real checks (role + ACTIVE in the database) run in requireRole().
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    // With JWT sessions the cookie is re-issued on every request through the proxy,
    // so this is an idle timeout, not an absolute one.
    maxAge: SESSION_IDLE_SECONDS,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    /** Optimistic route check in the proxy (NFR02). */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      // Signed-in users skip the auth screens; /dashboard and / go to their own home.
      // Exception: requireRole() sends a stale session (e.g. deactivated user) to /login?reason=...,
      // which must not bounce back.
      const isAuthScreen = pathname === "/login" || pathname === "/signup";
      const stale = request.nextUrl.searchParams.has("reason");
      if (role && ((isAuthScreen && !stale) || pathname === "/dashboard")) {
        return Response.redirect(new URL(roleHome[role], request.nextUrl));
      }
      if (pathname === "/dashboard") return false; // not signed in: to /login

      // No landing page: "/" opens the login stage, or the role home for a signed-in user.
      if (pathname === "/") return Response.redirect(new URL(role ? roleHome[role] : "/login", request.nextUrl));

      const area = areaFor(pathname);
      if (!area) return true;
      if (!role) return false; // Auth.js redirects to /login with a callbackUrl
      if (role !== area) return Response.redirect(new URL(roleHome[role], request.nextUrl));
      return true;
    },
  },
} satisfies NextAuthConfig;
