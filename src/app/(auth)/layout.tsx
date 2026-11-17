import type { ReactNode } from "react";
import { KpmLockup } from "@/components/brand/kpm-logo";
import { DoorProvider } from "@/components/stage/door-context";
import { DoorStage } from "@/components/stage/door-stage";

/**
 * Login and sign up: a "big moment" stage, always dark.
 * The form comes first in the reading order (and first on phones); the door sits beside it on desktop.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="dark" data-stage className="min-h-dvh bg-canvas text-ink">
      <DoorProvider>
        <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-12 px-4 py-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <main className="w-full max-w-md justify-self-center lg:order-2">
            <KpmLockup />
            <h1 className="mt-8 font-display text-4xl font-bold tracking-tight lg:text-5xl">
              Knock once.
              <br />
              <span className="text-primary">The door opens.</span>
            </h1>
            <p className="mt-3 text-muted">Book consultations with your lecturer and track every appointment.</p>
            <div className="mt-8">{children}</div>
          </main>
          <div className="flex justify-center lg:order-1">
            <DoorStage />
          </div>
        </div>
      </DoorProvider>
    </div>
  );
}
