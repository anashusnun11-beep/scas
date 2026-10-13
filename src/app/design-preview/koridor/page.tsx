import { Atkinson_Hyperlegible_Next, Schibsted_Grotesk } from "next/font/google";
import { DirectionPage } from "../_components/direction-page";
import { KoridorDoor } from "../_components/koridor-door";
import { getDirection } from "../_lib/directions";

const display = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-body" });

export default function KoridorPreview() {
  return (
    <DirectionPage
      direction={getDirection("koridor")}
      fontClassName={`${display.variable} ${body.variable}`}
      door={<KoridorDoor />}
    />
  );
}
