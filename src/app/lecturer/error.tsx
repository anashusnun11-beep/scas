"use client";

import { ErrorView } from "@/components/layout/error-view";

/** Errors inside the signed-in area: the sidebar stays, so the user can carry on elsewhere. */
export default function AreaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
