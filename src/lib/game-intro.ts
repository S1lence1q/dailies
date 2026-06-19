import type { GameId } from "@/games/types";
import { getTodayKey } from "@/lib/daily";

function introKey(gameId: GameId): string {
  return `dailies_intro_${gameId}_${getTodayKey()}`;
}

export function hasSeenIntroToday(gameId: GameId): boolean {
  try {
    return localStorage.getItem(introKey(gameId)) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeenToday(gameId: GameId): void {
  try {
    localStorage.setItem(introKey(gameId), "1");
  } catch {}
}

/** Skip intro when the player already has today's save in progress */
export function hasGameProgressToday(gameId: GameId): boolean {
  const key = getTodayKey();
  try {
    switch (gameId) {
      case "verbum":
        return Boolean(localStorage.getItem(`dailies_verbum_${key}`));
      case "pitch": {
        const raw = localStorage.getItem(`dailies_pitch_${key}`);
        if (!raw) return false;
        const saved = JSON.parse(raw) as { attempts?: unknown[]; gameOver?: boolean };
        return Boolean(saved.attempts?.length || saved.gameOver);
      }
      case "ratio":
        return Boolean(localStorage.getItem(`dailies_ratio_${key}`));
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function shouldShowIntro(gameId: GameId): boolean {
  if (hasSeenIntroToday(gameId)) return false;
  if (hasGameProgressToday(gameId)) return false;
  return true;
}
