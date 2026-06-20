import type { ContentLocale } from "@/games/types";
import { getPuzzleNumber, getTodayKey } from "@/lib/daily";

export interface PitchTrack {
  id: number;
  locale: ContentLocale;
  artist: string;
  title: string;
  /** Extra strings accepted as correct (lowercase) */
  aliases?: string[];
  /** Optional iTunes track id for reliable preview lookup */
  itunesTrackId?: number;
}

/** Curated tracks with iTunes preview clips. Rotates daily. */
export const PITCH_TRACKS: PitchTrack[] = [
  {
    id: 1,
    locale: "en",
    artist: "Portishead",
    title: "Glory Box",
    aliases: ["glorybox"],
  },
  {
    id: 2,
    locale: "en",
    artist: "Billie Eilish",
    title: "bad guy",
    aliases: ["badguy"],
  },
  {
    id: 3,
    locale: "en",
    artist: "Daft Punk",
    title: "Get Lucky",
    aliases: ["getlucky"],
  },
  {
    id: 4,
    locale: "en",
    artist: "Arctic Monkeys",
    title: "Do I Wanna Know?",
    aliases: ["do i wanna know", "wanna know"],
  },
  {
    id: 5,
    locale: "en",
    artist: "Fleetwood Mac",
    title: "Dreams",
  },
  {
    id: 6,
    locale: "en",
    artist: "The Weeknd",
    title: "Blinding Lights",
    aliases: ["blindinglights"],
  },
  {
    id: 7,
    locale: "en",
    artist: "Radiohead",
    title: "Creep",
  },
  {
    id: 8,
    locale: "en",
    artist: "Dua Lipa",
    title: "Levitating",
  },
  {
    id: 9,
    locale: "en",
    artist: "Nirvana",
    title: "Smells Like Teen Spirit",
    aliases: ["teen spirit", "smells like teen spirit"],
  },
  {
    id: 10,
    locale: "en",
    artist: "ABBA",
    title: "Dancing Queen",
    aliases: ["dancingqueen"],
  },
];

export { getTodayKey };

export function getPitchPuzzleNumber(date = getTodayKey()): number {
  return getPuzzleNumber(412, date);
}
