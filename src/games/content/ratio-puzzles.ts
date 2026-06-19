import { getDayIndex, getTodayKey } from "@/lib/daily";

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
      { label: "Legs on an average millipede", value: 400, display: "400 legs" },
      { label: "Weight of a pair of AirPods Pro", value: 56, display: "56 g" },
      { label: "Monthly Google searches: “pizza”", value: 612000, display: "612K /mo" },
      { label: "Monthly Google searches: “sushi”", value: 301000, display: "301K /mo" },
      { label: "Population of Copenhagen", value: 644000, display: "644K" },
      { label: "Population of the Faroe Islands", value: 54000, display: "54K" },
      { label: "Price of a Tesla Model 3 (USD)", value: 45000, display: "$45K" },
      { label: "Price of a used bike on Craigslist (avg.)", value: 350, display: "$350" },
    ],
  },
  {
    id: 2,
    items: [
      { label: "Heartbeats per day (adult)", value: 100000, display: "100K" },
      { label: "Steps on a 10K-steps day", value: 10000, display: "10K" },
      { label: "Words in the English language (approx.)", value: 200000, display: "200K" },
      { label: "Words in an average rap verse", value: 80, display: "80 words" },
      { label: "Height of the Eiffel Tower (m)", value: 330, display: "330 m" },
      { label: "Height of the Statue of Liberty (m)", value: 93, display: "93 m" },
      { label: "Hours in a year", value: 8760, display: "8,760 h" },
      { label: "Hours you sleep in a year (8h/day)", value: 2920, display: "2,920 h" },
    ],
  },
  {
    id: 3,
    items: [
      { label: "Instagram users worldwide (approx.)", value: 2000000000, display: "2B" },
      { label: "People who have watched The Office (US)", value: 50000000, display: "50M" },
      { label: "Calories in a Big Mac", value: 508, display: "508 kcal" },
      { label: "Calories in a carrot", value: 25, display: "25 kcal" },
      { label: "Km to the Moon", value: 384400, display: "384,400 km" },
      { label: "Km from NYC to Boston", value: 346, display: "346 km" },
      { label: "Harry Potter books translated into", value: 80, display: "80 languages" },
      { label: "Languages in Google Translate", value: 130, display: "130 languages" },
    ],
  },
  {
    id: 4,
    items: [
      { label: "Hours on Netflix top 10 (weeks)", value: 5200, display: "5,200 weeks" },
      { label: "Hours you've rewatched the same show", value: 48, display: "48 h" },
      { label: "Percent water in the human body", value: 60, display: "60%" },
      { label: "Percent water in a cucumber", value: 96, display: "96%" },
      { label: "Price for 1 kg of gold (USD, approx.)", value: 65000, display: "$65K" },
      { label: "Price for 1 kg of bananas", value: 2, display: "$2" },
      { label: "Followers on @nasa (M)", value: 95, display: "95M" },
      { label: "Followers on your local bakery", value: 1200, display: "1.2K" },
    ],
  },
  {
    id: 5,
    items: [
      { label: "Neurons in the human brain (approx.)", value: 86000000000, display: "86B" },
      { label: "Tabs open in your Excel workbook", value: 12, display: "12 tabs" },
      { label: "Liters of water in an Olympic pool", value: 2500000, display: "2.5M L" },
      { label: "Cups of coffee Americans drink per day (approx.)", value: 400000000, display: "400M cups" },
      { label: "Cars sold in the US (2023)", value: 15600000, display: "15.6M" },
      { label: "E-bikes sold in the US (2023)", value: 1400000, display: "1.4M" },
      { label: "Seconds in 10 years", value: 315360000, display: "315M s" },
      { label: "Seconds you've waited on “2 minutes”", value: 900, display: "15 min" },
    ],
  },
  {
    id: 6,
    items: [
      { label: "Stars in the Milky Way (approx.)", value: 400000000000, display: "400B" },
      { label: "Stars visible without a telescope", value: 4500, display: "4,500" },
      { label: "Downloads of Minecraft (approx.)", value: 300000000, display: "300M" },
      { label: "Downloads of your friend's podcast", value: 340, display: "340" },
      { label: "Teeth on a shark (lifetime)", value: 30000, display: "30K" },
      { label: "Teeth on an adult human", value: 32, display: "32" },
      { label: "Meters on the world's longest zipline", value: 2800, display: "2,800 m" },
      { label: "Meters from your couch to the fridge", value: 4, display: "4 m" },
    ],
  },
  {
    id: 7,
    items: [
      { label: "Pixels on a 4K TV", value: 8294400, display: "8.3M px" },
      { label: "Pixels on a Game Boy screen", value: 23040, display: "23K px" },
      { label: "Years dinosaurs lived (millions)", value: 165, display: "165M years" },
      { label: "Years you've had the same password", value: 8, display: "8 years" },
      { label: "Price of iPhone 16 Pro Max (USD)", value: 1200, display: "$1,200" },
      { label: "Price of a pack of gum", value: 2, display: "$2" },
      { label: "Songs on Spotify", value: 100000000, display: "100M" },
      { label: "Songs in your “Later” playlist", value: 847, display: "847" },
    ],
  },
];

export { getTodayKey };

export function getRatioPuzzleForDate(date = getTodayKey()): RatioPuzzle {
  return RATIO_PUZZLES[getDayIndex(date) % RATIO_PUZZLES.length];
}

export function getRatioPuzzleNumber(date = getTodayKey()): number {
  return getDayIndex(date) + 203;
}
