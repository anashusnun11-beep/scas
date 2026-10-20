import { redirect } from "next/navigation";

/**
 * No landing page: "/" opens the login stage straight away. The proxy (authConfig.authorized) already
 * sends visitors to /login and signed-in users to their role home; this redirect is the fallback.
 */
export default function Home() {
  redirect("/login");
}
