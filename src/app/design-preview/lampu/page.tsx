import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { DirectionPage } from "../_components/direction-page";
import { LampuDoor } from "../_components/lampu-door";
import { getDirection } from "../_lib/directions";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export default function LampuPreview() {
  return (
    <DirectionPage
      direction={getDirection("lampu")}
      fontClassName={`${display.variable} ${body.variable}`}
      door={<LampuDoor />}
    />
  );
}
