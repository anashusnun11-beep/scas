import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Next.js 16 proxy (formerly middleware). Two jobs:
 * 1. Optimistic role gate for /student, /lecturer, /admin (see authConfig.callbacks.authorized).
 * 2. Re-issue the session cookie on every request, which makes the 30-minute limit an idle timeout.
 * The authoritative checks are in requireRole() on every page and server action.
 */
const { auth } = NextAuth(authConfig);

// Next.js needs a plain function export here (a destructured export isn't recognised).
export default auth;

export const config = {
  // Everything except static files, images and the Auth.js API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
