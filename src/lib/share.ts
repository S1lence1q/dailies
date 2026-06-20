import { VISIBLE_GAMES } from "@/games/registry";
import type { GameId, GameResult } from "@/games/types";

export function formatDailyResultsLine(
  results: Record<string, GameResult | null | undefined>,
): string {
  return VISIBLE_GAMES.map((game) => {
    const result = results[game.id];
    return result ? `${game.name} ${result.label}` : `${game.name} —`;
  }).join(" · ");
}

export function buildDailyShareText(
  results: Record<string, GameResult | null | undefined>,
  streak: number,
  dateLabel?: string,
): string {
  const date =
    dateLabel ??
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const lines = VISIBLE_GAMES.map((game) => {
    const result = results[game.id];
    const score = result?.label ?? "—";
    return `${game.name} ${score}`;
  });

  return [`dailies · ${date}`, ...lines, "", `🔥 ${streak}`].join("\n");
}

export function copyShareText(text: string): void {
  navigator.clipboard?.writeText(text).catch(() => {});
}
