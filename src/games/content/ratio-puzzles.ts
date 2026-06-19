export interface RatioItem {
  label: string;
  value: number;
  display: string;
}

export interface RatioPuzzle {
  id: number;
  items: RatioItem[];
}

/** Curated daily Higher-or-Lower chains. Values are intentionally absurd to compare. */
export const RATIO_PUZZLES: RatioPuzzle[] = [
  {
    id: 1,
    items: [
      { label: "Ben på et gennemsnitligt tusindben", value: 400, display: "400 ben" },
      { label: "Vægt af et par AirPods Pro", value: 56, display: "56 g" },
      { label: "Månedlige Google-søgninger: “pizza”", value: 612000, display: "612K /md" },
      { label: "Månedlige Google-søgninger: “sushi”", value: 301000, display: "301K /md" },
      { label: "Indbyggere i København", value: 644000, display: "644K" },
      { label: "Indbyggere på Færøerne", value: 54000, display: "54K" },
      { label: "Pris på en Tesla Model 3 (DKK)", value: 350000, display: "350K kr" },
      { label: "Pris på en brugt cykel på DBA (gns.)", value: 2500, display: "2.5K kr" },
    ],
  },
  {
    id: 2,
    items: [
      { label: "Hjerteslag pr. dag (voksen)", value: 100000, display: "100K" },
      { label: "Skridt i en 10K skridts dag", value: 10000, display: "10K" },
      { label: "Ord i det danske sprog (ca.)", value: 200000, display: "200K" },
      { label: "Ord i et gennemsnitligt rap-vers", value: 80, display: "80 ord" },
      { label: "Højde af Eiffeltårnet (m)", value: 330, display: "330 m" },
      { label: "Højde af Statue of Liberty (m)", value: 93, display: "93 m" },
      { label: "Timer i et år", value: 8760, display: "8.760 t" },
      { label: "Timer du sover på et år (8t/dag)", value: 2920, display: "2.920 t" },
    ],
  },
  {
    id: 3,
    items: [
      { label: "Instagram-brugere i Danmark (ca.)", value: 3200000, display: "3,2M" },
      { label: "Danskere der har set Matador", value: 2500000, display: "2,5M" },
      { label: "Kalorier i en Big Mac", value: 508, display: "508 kcal" },
      { label: "Kalorier i en gulerod", value: 25, display: "25 kcal" },
      { label: "Km til månen", value: 384400, display: "384.400 km" },
      { label: "Km fra Kbh til Aarhus", value: 187, display: "187 km" },
      { label: "Bøger udgivet om Harry Potter (sprog)", value: 80, display: "80 sprog" },
      { label: "Sprog i Google Translate", value: 130, display: "130 sprog" },
    ],
  },
  {
    id: 4,
    items: [
      { label: "Timer på Netflix-top 10 (uger)", value: 5200, display: "5.200 uger" },
      { label: "Timer du har set samme serie igen", value: 48, display: "48 t" },
      { label: "Procent vand i menneskekroppen", value: 60, display: "60%" },
      { label: "Procent vand i en agurk", value: 96, display: "96%" },
      { label: "Pris for 1 kg guld (DKK, ca.)", value: 450000, display: "450K kr" },
      { label: "Pris for 1 kg bananer", value: 15, display: "15 kr" },
      { label: "Følgere på @nasa (M)", value: 95, display: "95M" },
      { label: "Følgere på din lokale bager", value: 1200, display: "1,2K" },
    ],
  },
  {
    id: 5,
    items: [
      { label: "Neuroner i menneskehjernet (ca.)", value: 86000000000, display: "86 mia" },
      { label: "Tabs i et Excel-ark du har åbent", value: 12, display: "12 faner" },
      { label: "Liter vand i en olympisk pool", value: 2500000, display: "2,5M L" },
      { label: "Liter kaffe danskere drikker om dagen (gns.)", value: 1500000, display: "1,5M L" },
      { label: "Biler solgt i DK 2023", value: 180000, display: "180K" },
      { label: "Elcykler solgt i DK 2023", value: 100000, display: "100K" },
      { label: "Sekunder i 10 år", value: 315360000, display: "315M s" },
      { label: "Sekunder du har ventet på nogen der siger “2 min”", value: 900, display: "15 min" },
    ],
  },
  {
    id: 6,
    items: [
      { label: "Stjerner i Mælkevejen (ca.)", value: 400000000000, display: "400 mia" },
      { label: "Stjerner du kan se uden teleskop", value: 4500, display: "4.500" },
      { label: "Downloads af Minecraft (ca.)", value: 300000000, display: "300M" },
      { label: "Downloads af din venindes podcast", value: 340, display: "340" },
      { label: "Tænder på en haj (livstid)", value: 30000, display: "30K" },
      { label: "Tænder på et voksent menneske", value: 32, display: "32" },
      { label: "Meter i verdens længste zipline", value: 2800, display: "2.800 m" },
      { label: "Meter fra din sofa til køleskabet", value: 4, display: "4 m" },
    ],
  },
  {
    id: 7,
    items: [
      { label: "Pixels på et 4K TV", value: 8294400, display: "8,3M px" },
      { label: "Pixels på et Game Boy-skærm", value: 23040, display: "23K px" },
      { label: "År dinosaurer levede (millioner)", value: 165, display: "165M år" },
      { label: "År du har haft samme adgangskode", value: 8, display: "8 år" },
      { label: "Pris for iPhone 16 Pro Max (DKK)", value: 12000, display: "12K kr" },
      { label: "Pris for en pakke tyggegummi", value: 12, display: "12 kr" },
      { label: "Sange på Spotify", value: 100000000, display: "100M" },
      { label: "Sange i din “Later” playliste", value: 847, display: "847" },
    ],
  },
];

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getRatioPuzzleForDate(date = getTodayKey()): RatioPuzzle {
  const start = new Date("2024-01-01").getTime();
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((d.getTime() - start) / 86400000);
  return RATIO_PUZZLES[dayIndex % RATIO_PUZZLES.length];
}
