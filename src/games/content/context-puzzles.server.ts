import "server-only";

import { getTodayKey } from "@/lib/daily";
import { getOverridesForDate } from "@/lib/daily-overrides-store.server";
import { pickByTarget } from "@/lib/daily-content";
import { CONTEXT_PUZZLES, type ContextPuzzle } from "@/games/content/context-puzzles";

export function getContextPuzzleForDate(date = getTodayKey()): ContextPuzzle {
  const { context } = getOverridesForDate(date);
  return pickByTarget(CONTEXT_PUZZLES, date, context, (target) => ({
    id: 0,
    target,
    theme: "",
    hint: "",
  }));
}
