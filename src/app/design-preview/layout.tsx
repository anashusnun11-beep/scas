import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./preview.css";

export const metadata: Metadata = {
  title: "SCAS design preview",
  robots: { index: false, follow: false },
};

export default function DesignPreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
