import { getDayIndex, getTodayKey } from "@/lib/daily";

export interface ContextPuzzle {
  id: number;
  /** Secret answer — never sent to the client */
  target: string;
  theme: string;
  hint: string;
}

export const CONTEXT_PUZZLES: ContextPuzzle[] = [
  { id: 1, target: "anchor", theme: "nautical", hint: "Think sea, ships, and harbors" },
  { id: 2, target: "library", theme: "quiet knowledge", hint: "Think books, shelves, and reading" },
  { id: 3, target: "ocean", theme: "deep blue", hint: "Think water, waves, and depth" },
  { id: 4, target: "winter", theme: "cold season", hint: "Think snow, frost, and holidays" },
  { id: 5, target: "garden", theme: "green growth", hint: "Think plants, soil, and outdoors" },
  { id: 6, target: "telescope", theme: "night sky", hint: "Think stars, space, and looking up" },
  { id: 7, target: "memory", theme: "mind palace", hint: "Think mind, past, and remembering" },
  { id: 8, target: "bridge", theme: "connection", hint: "Think crossing, linking two sides" },
  { id: 9, target: "silence", theme: "stillness", hint: "Think quiet, calm, and absence of sound" },
  { id: 10, target: "compass", theme: "navigation", hint: "Think direction, maps, and finding north" },
  { id: 11, target: "vessel", theme: "at sea", hint: "Think ships, containers, and holding" },
  { id: 12, target: "horizon", theme: "far line", hint: "Think distance, sky, and the edge of sight" },
  { id: 13, target: "thunder", theme: "storm", hint: "Think lightning, rain, and loud sky" },
  { id: 14, target: "melody", theme: "sound", hint: "Think music, tune, and song" },
  { id: 15, target: "shadow", theme: "dark shape", hint: "Think light blocked, silhouette" },
  { id: 16, target: "forest", theme: "woods", hint: "Think trees, trails, and wild places" },
  { id: 17, target: "planet", theme: "space", hint: "Think orbit, sphere, and worlds" },
  { id: 18, target: "mirror", theme: "reflection", hint: "Think glass, image, and self" },
  { id: 19, target: "signal", theme: "transmission", hint: "Think radio, message, and beeps" },
  { id: 20, target: "gravity", theme: "physics", hint: "Think weight, fall, and pull" },
  { id: 21, target: "journey", theme: "travel", hint: "Think road, trip, and miles" },
  { id: 22, target: "crystal", theme: "clear stone", hint: "Think glass, gem, and structure" },
  { id: 23, target: "frontier", theme: "edge", hint: "Think border, new land, and limit" },
  { id: 24, target: "language", theme: "words", hint: "Think speech, grammar, and meaning" },
  { id: 25, target: "harbor", theme: "port", hint: "Think boats, dock, and shelter" },
];

export { getTodayKey };

export function getContextPuzzleNumber(date = getTodayKey()): number {
  return getDayIndex(date) + 631;
}
