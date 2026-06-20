import type { GameId } from "@/games/types";

function rulesKey(gameId: GameId): string {
  return `dailies_rules_${gameId}`;
}

export function hasSeenRules(gameId: GameId): boolean {
  try {
    return localStorage.getItem(rulesKey(gameId)) === "1";
  } catch {
    return false;
  }
}

export function markRulesSeen(gameId: GameId): void {
  try {
    localStorage.setItem(rulesKey(gameId), "1");
  } catch {}
}

export function shouldShowRules(gameId: GameId): boolean {
  return !hasSeenRules(gameId);
}
