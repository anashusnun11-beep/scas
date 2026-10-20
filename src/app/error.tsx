"use client";

import { ErrorView } from "@/components/layout/error-view";

/** Errors on the pages outside the role areas (login, sign up). */
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-ink">
      <ErrorView error={error} retry={retry} home={{ href: "/login", label: "Back to log in" }} className="w-full max-w-lg bg-surface" />
    </main>
  );
}
