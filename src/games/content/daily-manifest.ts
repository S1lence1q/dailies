/**
 * Daily content overrides — edit this file to pin any day's puzzles.
 *
 * HOW IT WORKS
 * ────────────
 * • Each game has a pool (verbum words, context targets, pitch tracks, ratio chains).
 * • By default: pool rotates automatically via day index (same day = same puzzle worldwide).
 * • Add a date key here to override one or more games for that specific day.
 *
 * EXAMPLE — swap only today's CONTEXT word:
 *   "2026-06-20": { context: "vessel" },
 *
 * EXAMPLE — full editorial control for launch day:
 *   "2026-07-01": {
 *     verbum: "BLAZE",
 *     context: "horizon",
 *     pitch: 4,
 *     ratio: 2,
 *   },
 *
 * IDs for pitch/ratio match `id` in pitch-tracks.ts / ratio-puzzles.ts.
 * Context/verbum use the word itself (must exist in vocabulary / word list).
 *
 * Dev preview: append ?date=2026-06-20 to the URL (development only).
 */

export type DailyOverrides = {
  verbum?: string;
  context?: string;
  pitch?: number;
  ratio?: number;
};

export const DAILY_OVERRIDES: Record<string, DailyOverrides> = {
  // "2026-06-20": { context: "vessel" },
};
