import { CompassIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Unknown URLs, and records the user may not open (NFR03 answers those with a 404 on purpose). */
export function NotFoundView({ className }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={CompassIcon}
      title="Page not found"
      action={
        <Link href="/" className={buttonClasses()}>
          Go to my dashboard
        </Link>
      }
    >
      This page does not exist, or it belongs to another account. Check the link, or go back to your dashboard.
    </EmptyState>
  );
}
