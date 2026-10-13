"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog; "Save as PDF" covers the download case (FR07). */
export function PrintButton({ label = "Print slip" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <PrinterIcon aria-hidden className="size-4" weight="bold" />
      {label}
    </Button>
  );
}
