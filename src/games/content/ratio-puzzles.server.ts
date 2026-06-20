import "server-only";

import { getTodayKey } from "@/lib/daily";
import { getOverridesForDate } from "@/lib/daily-overrides-store.server";
import { pickById } from "@/lib/daily-content";
import { RATIO_PUZZLES, type RatioPuzzle } from "@/games/content/ratio-puzzles";

export function getRatioPuzzleForDate(date = getTodayKey()): RatioPuzzle {
  const { ratio } = getOverridesForDate(date);
  return pickById(RATIO_PUZZLES, date, ratio);
}
