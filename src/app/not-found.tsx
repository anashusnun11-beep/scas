import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/not-found-view";

export const metadata: Metadata = { title: "Page not found | SCAS" };

/** 404 outside the role areas (unknown top-level URLs). */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-ink">
      <NotFoundView className="w-full max-w-lg bg-surface" />
    </main>
  );
}
