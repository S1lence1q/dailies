/**
 * Game color palettes. CONTEXT uses a high-contrast dark + orange system
 * (similarity bars read instantly, low eye strain in long sessions).
 */
export const PALETTES = {
  contextEditorial: {
    name: "Context",
    bg: "#0A0A0A",
    fg: "#F5F5F5",
    accent: "#FF5500",
    surface: "#141414",
    border: "#252525",
    muted: "#707070",
  },
} as const;

export type PaletteId = keyof typeof PALETTES;
export type GamePalette = (typeof PALETTES)[PaletteId];

export const CONTEXT_PALETTE = PALETTES.contextEditorial;

/** Rank warmth — orange bars for warm, red stripe for cold */
export const CONTEXT_HEAT = {
  win: "#22C55E",
  hot: "#FF5500",
  warm: "#FF5500",
  cool: "#2A2A2A",
  cold: "#EF4444",
} as const;
