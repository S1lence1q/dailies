import { getDayIndex, getTodayKey } from "@/lib/daily";
import { DAILY_OVERRIDES, type DailyOverrides } from "@/games/content/daily-manifest";

export function getOverridesForDate(date = getTodayKey()): DailyOverrides {
  return DAILY_OVERRIDES[date] ?? {};
}

/** Pick from a numbered pool, or use manifest override id when set. */
export function pickById<T extends { id: number }>(
  pool: T[],
  date: string,
  overrideId?: number,
): T {
  if (overrideId !== undefined) {
    const match = pool.find((p) => p.id === overrideId);
    if (match) return match;
  }
  if (pool.length === 0) throw new Error("Daily content pool is empty");
  return pool[getDayIndex(date) % pool.length];
}

export function pickByWord(
  pool: string[],
  date: string,
  overrideWord?: string,
): string {
  if (overrideWord) {
    const upper = overrideWord.toUpperCase();
    if (pool.includes(upper)) return upper;
    return upper;
  }
  if (pool.length === 0) throw new Error("Daily word pool is empty");
  return pool[getDayIndex(date) % pool.length];
}

export function pickByTarget<T extends { target: string }>(
  pool: T[],
  date: string,
  overrideTarget?: string,
  fallback?: (target: string) => T,
): T {
  if (overrideTarget) {
    const word = overrideTarget.toLowerCase();
    const match = pool.find((p) => p.target === word);
    if (match) return match;
    if (fallback) return fallback(word);
    return { target: word } as T;
  }
  if (pool.length === 0) throw new Error("Daily context pool is empty");
  return pool[getDayIndex(date) % pool.length];
}
