export type GameId =
  | "verbum"
  | "pitch"
  | "ratio"
  | "context"
  | "echo"
  | "glyph";

export type GameStatus = "live" | "soon" | "hidden";

/** Content language — UI stays English; packs can be added later */
export type ContentLocale = "en" | "da";

export type GameResult = { label: string; sub: string };

export interface GameTheme {
  bg: string;
  fg: string;
  accent: string;
}

export interface GameDefinition extends GameTheme {
  id: GameId;
  name: string;
  number: number;
  genre: string;
  status: GameStatus;
  /** Shown on homepage grid */
  visible: boolean;
  tagline: string;
  comingSoonTagline?: string;
  gridArea: string;
  coverLabel?: string;
  coverHint?: string;
}

export interface GamePlayerProps {
  streak: number;
  onComplete: (result: GameResult) => void;
}
