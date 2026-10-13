export type DirectionSlug = "koridor" | "papan" | "lampu";

export type Direction = {
  slug: DirectionSlug;
  number: 1 | 2 | 3;
  name: string;
  tagline: string;
  mood: string;
  nativeTheme: "light" | "dark";
  palette: { name: string; hex: string; role: string }[];
  fonts: { display: string; body: string; mono?: string };
  motion: string;
  door: string;
  appFeel: string;
  tradeOff: string;
};

export const directions: Direction[] = [
  {
    slug: "koridor",
    number: 1,
    name: "Koridor",
    tagline: "Daylight, calm, architectural",
    mood: "A quiet faculty corridor at 10 a.m. Plaster walls, a navy door, one sign that tells you whether to knock. Feels like the college, only tidier.",
    nativeTheme: "light",
    palette: [
      { name: "Plaster", hex: "#F3F4F1", role: "Background" },
      { name: "KPM Navy", hex: "#2B3990", role: "Primary, doors, buttons" },
      { name: "Ink", hex: "#151A30", role: "Text" },
      { name: "Ketuk Red", hex: "#C8202A", role: "Stop sign, destructive" },
      { name: "Masuk Green", hex: "#1E7F52", role: "Go sign, approved" },
    ],
    fonts: { display: "Schibsted Grotesk", body: "Atkinson Hyperlegible Next" },
    motion: "Physical. The door swings on a soft spring hinge with a small overshoot, like a real door settling. In the app, motion is under 250 ms: counters ease in, chosen slots press down.",
    door: "CSS 3D door with real thickness. One knock, the hanging sign flips from SILA KETUK to SILA MASUK, then the door swings toward you and shows the dashboard behind it.",
    appFeel: "Light, spacious cards with thin lines. Navy carries every action, red and green only appear for meaning.",
    tradeOff: "The safest and most readable of the three. Less of a wow on first sight.",
  },
  {
    slug: "papan",
    number: 2,
    name: "Papan Tanda",
    tagline: "Wayfinding signage, bold, mechanical",
    mood: "Campus signage and airport boards. Huge room numbers, KPM gold on graphite, hard edges, a split-flap board above the door.",
    nativeTheme: "light",
    palette: [
      { name: "Signal Gold", hex: "#FFC20E", role: "Primary, doors, buttons" },
      { name: "Graphite", hex: "#15171C", role: "Text, boards, lines" },
      { name: "Concrete", hex: "#EDEDEA", role: "Background" },
      { name: "Ketuk Red", hex: "#E3262F", role: "Stop sign, destructive" },
      { name: "Masuk Green", hex: "#0E9F5B", role: "Go sign, approved" },
    ],
    fonts: { display: "Archivo Expanded", body: "Archivo", mono: "JetBrains Mono" },
    motion: "Mechanical. Split-flap letters clatter from KETUK to MASUK one cell at a time, then the door swings on a crisp, no-bounce curve. In the app, changes snap with short flips, nothing floats.",
    door: "A flat signage door with a giant room number. The split-flap board sits on the frame above it, so the sign stays readable after the door opens onto a departure-board style schedule.",
    appFeel: "Zero radius, 1 px graphite rules, monospace times and IDs. Feels like a timetable you can trust.",
    tradeOff: "The most distinctive and memorable. Loud, so the app screens need discipline to stay calm.",
  },
  {
    slug: "lampu",
    number: 3,
    name: "Lampu Pejabat",
    tagline: "After hours, cinematic, warm",
    mood: "The corridor after dark. A wooden door, a warm lamp behind it, light spilling across the floor as it opens. The only dark-first option.",
    nativeTheme: "dark",
    palette: [
      { name: "Night Navy", hex: "#0A0D1A", role: "Background" },
      { name: "Deep Surface", hex: "#121731", role: "Cards" },
      { name: "Lamp Amber", hex: "#FFB547", role: "Primary, light, buttons" },
      { name: "Ketuk Red", hex: "#F0525A", role: "Stop sign, destructive" },
      { name: "Masuk Green", hex: "#3DD68C", role: "Go sign, approved" },
    ],
    fonts: { display: "Bricolage Grotesque", body: "Manrope" },
    motion: "Cinematic on the landing only. A thin line of light leaks through the gap, then the heavy door eases open over 1.6 s and lamp light spreads across the floor. The app keeps the warmth but moves fast: soft focus glow, quick fades.",
    door: "Dark wooden door with panels and a steel nameplate. The light leak and floor spill are the story. In the real build this one moves to React Three Fiber for real lighting.",
    appFeel: "Deep navy cards, amber actions, generous radius. Comfortable at night, still has a light mode.",
    tradeOff: "The most atmospheric. Heaviest landing page, and dark-first needs care with long forms.",
  },
];

export function getDirection(slug: DirectionSlug) {
  const direction = directions.find((d) => d.slug === slug);
  if (!direction) throw new Error(`Unknown direction: ${slug}`);
  return direction;
}
