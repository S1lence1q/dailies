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

export type GameCoverVisual =
  | { kind: "verbum"; rows: ("correct" | "present" | "absent")[][] }
  | {
      kind: "pitch";
      blocks: ("correct" | "artist" | "wrong" | "skipped")[];
      artist?: string;
    }
  | { kind: "ratio"; correct: number; total: number }
  | { kind: "context"; bestRank: number };

export type GameResult = { label: string; sub: string; cover?: GameCoverVisual };

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
  played: Set<string>;
  onComplete: (result: GameResult) => void;
  onPlayNext?: (gameId: GameId) => void;
  onBackToLineup?: () => void;
}
