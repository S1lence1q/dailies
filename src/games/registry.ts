import type { GameDefinition, GameId } from "./types";
import { getPuzzleNumber } from "@/lib/daily";

export const GAMES: GameDefinition[] = [
  {
    id: "verbum",
    name: "VERBUM",
    number: 847,
    genre: "Word",
    status: "live",
    visible: true,
    tagline: "Five letters. Six tries. One word — reset at midnight.",
    gridArea: "verbum",
    coverHint: "WORD · ~3 MIN",
    bg: "#1B3426",
    fg: "#D5EAD8",
    accent: "#6BAF84",
  },
  {
    id: "pitch",
    name: "PITCH",
    number: 412,
    genre: "Music",
    status: "live",
    visible: true,
    tagline: "Guess the song from a short clip. Each skip reveals more.",
    gridArea: "pitch",
    coverLabel: "MUSIC",
    bg: "#101928",
    fg: "#B5C8E2",
    accent: "#4A6EA8",
  },
  {
    id: "ratio",
    name: "RATIO",
    number: 203,
    genre: "Compare",
    status: "live",
    visible: true,
    tagline: "Higher or lower — absurd comparisons, one wrong ends the run.",
    gridArea: "ratio",
    coverHint: "Compare · Higher or lower",
    bg: "#B84028",
    fg: "#F4E0D5",
    accent: "#F0987A",
  },
  {
    id: "context",
    name: "CONTEXT",
    number: 631,
    genre: "Language",
    status: "soon",
    visible: true,
    tagline: "Navigate meaning by proximity. Find the word hidden inside language itself.",
    comingSoonTagline:
      "Every word you guess reveals how close you are. Find the hidden word by navigating meaning.",
    gridArea: "context",
    bg: "#1E1228",
    fg: "#CDBDE0",
    accent: "#6A4A88",
  },
  {
    id: "echo",
    name: "ECHO",
    number: 290,
    genre: "Trivia",
    status: "hidden",
    visible: false,
    tagline: "Six clues. One answer. A new pop culture mystery every day.",
    comingSoonTagline: "Six clues. One answer. A new pop culture mystery every day.",
    gridArea: "echo",
    coverLabel: "TRIVIA",
    bg: "#C49018",
    fg: "#1A1008",
    accent: "rgba(26,16,8,0.6)",
  },
  {
    id: "glyph",
    name: "GLYPH",
    number: 119,
    genre: "Pattern",
    status: "hidden",
    visible: false,
    tagline: "A pattern appears one piece at a time. Recognize it before it's complete.",
    comingSoonTagline:
      "A pattern appears one piece at a time. Recognize it before it's complete.",
    gridArea: "glyph",
    coverLabel: "PATTERN",
    bg: "#161614",
    fg: "#D5D5CB",
    accent: "#7A7A70",
  },
];

export const VISIBLE_GAMES = GAMES.filter((g) => g.visible);

export const HIDDEN_GAMES = GAMES.filter((g) => !g.visible);

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}

/** Daily puzzle number — increments from each game's launch base */
export function getGameNumber(game: GameDefinition | GameId): number {
  const def = typeof game === "string" ? getGame(game) : game;
  if (!def) return 0;
  return getPuzzleNumber(def.number);
}

export function getCoverLabel(game: GameDefinition): string {
  const n = getGameNumber(game);
  switch (game.id) {
    case "verbum":
    case "ratio":
      return `NO. ${n}`;
    case "pitch":
      return "MUSIC";
    case "context":
      return `LANGUAGE · NO. ${n}`;
    default:
      return game.coverLabel ?? game.name;
  }
}

export function getCoverHint(game: GameDefinition): string | undefined {
  const n = getGameNumber(game);
  switch (game.id) {
    case "verbum":
      return "WORD · ~3 MIN";
    case "pitch":
      return `NO. ${n}`;
    case "ratio":
      return "Compare · Higher or lower";
    default:
      return game.coverHint;
  }
}

export const EDITOR_NOTES = [
  "Today's VERBUM leans botanical. PITCH will catch you off guard — it's from the late 90s.",
  "RATIO starts easy today. Don't get comfortable.",
  "CONTEXT has a nautical theme. Trust your first instinct.",
  "VERBUM is a trap. Don't overthink the vowels.",
  "RATIO has some wild unit mismatches today. Trust the number, not your gut.",
  "Friday's lineup is heavier than usual. Clear your head first.",
  "Saturday. Our favorites of the week. Take your time with each one.",
];

/** CSS grid-template-areas for visible game count */
export function getGridAreas(): string {
  if (VISIBLE_GAMES.length === 4) {
    return `
      "verbum pitch"
      "verbum ratio"
      "context context"
    `;
  }
  return VISIBLE_GAMES.map((g) => `"${g.gridArea}"`).join("\n");
}

export function getGridRows(): string {
  if (VISIBLE_GAMES.length === 4) {
    return "270px 270px auto";
  }
  return "auto";
}

export function getGridColumns(): string {
  if (VISIBLE_GAMES.length === 4) {
    return "repeat(2, 1fr)";
  }
  return "repeat(3, 1fr)";
}

export function getMobileGridAreas(): string {
  return VISIBLE_GAMES.map((g) => `"${g.gridArea}"`).join("\n");
}

export function getTabletGridAreas(): string {
  if (VISIBLE_GAMES.length === 4) {
    return `
      "verbum pitch"
      "verbum ratio"
      "context context"
    `;
  }
  return getMobileGridAreas();
}
