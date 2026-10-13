import { Archivo, JetBrains_Mono } from "next/font/google";
import { DirectionPage } from "../_components/direction-page";
import { PapanDoor } from "../_components/papan-door";
import { getDirection } from "../_lib/directions";

// One variable family for display and body; the display face uses the expanded width axis.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function PapanPreview() {
  return (
    <DirectionPage
      direction={getDirection("papan")}
      fontClassName={`${archivo.variable} ${mono.variable} [--font-body:var(--font-display)]`}
      door={<PapanDoor />}
    />
  );
}
