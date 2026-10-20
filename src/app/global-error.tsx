"use client";

import { ErrorView } from "@/components/layout/error-view";
import "./globals.css";

/** Last resort: the root layout itself failed, so this renders its own document (light theme). */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" data-theme="light">
      <body className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-ink">
        <title>Something went wrong | SCAS</title>
        <ErrorView error={error} retry={retry} home={{ href: "/login", label: "Back to log in" }} className="w-full max-w-lg bg-surface" />
      </body>
    </html>
  );
}
