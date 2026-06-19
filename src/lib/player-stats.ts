import type { GameId, GameResult } from "@/games/types";
import { getTodayKey } from "@/lib/daily";

const STATS_KEY = "dailies_player_stats";

export interface PlayerStats {
  bestStreak: number;
  daysPlayed: number;
  // VERBUM
  verbumWins: number;
  verbumLosses: number;
  verbumDistribution: number[];
  // PITCH
  pitchWins: number;
  pitchLosses: number;
  pitchDistribution: number[];
  // RATIO
  ratioPlays: number;
  ratioWins: number; // perfect runs
  ratioHighScore: number;
  // CONTEXT
  contextWins: number;
  contextLosses: number;
  contextGuessesSum: number;

  // Combined stats
  gamesWon: number;
  gamesLost: number;
  lastRecordedDay?: string;
}

const EMPTY: PlayerStats = {
  bestStreak: 0,
  daysPlayed: 0,
  verbumWins: 0,
  verbumLosses: 0,
  verbumDistribution: [0, 0, 0, 0, 0, 0],
  pitchWins: 0,
  pitchLosses: 0,
  pitchDistribution: [0, 0, 0, 0, 0, 0],
  ratioPlays: 0,
  ratioWins: 0,
  ratioHighScore: 0,
  contextWins: 0,
  contextLosses: 0,
  contextGuessesSum: 0,
  gamesWon: 0,
  gamesLost: 0,
};

function save(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {
      ...EMPTY,
      verbumDistribution: [...EMPTY.verbumDistribution],
      pitchDistribution: [...EMPTY.pitchDistribution],
    };
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      ...EMPTY,
      ...parsed,
      verbumDistribution: parsed.verbumDistribution?.length === 6
        ? parsed.verbumDistribution
        : [...EMPTY.verbumDistribution],
      pitchDistribution: parsed.pitchDistribution?.length === 6
        ? parsed.pitchDistribution
        : [...EMPTY.pitchDistribution],
    };
  } catch {
    return {
      ...EMPTY,
      verbumDistribution: [...EMPTY.verbumDistribution],
      pitchDistribution: [...EMPTY.pitchDistribution],
    };
  }
}

function isWin(result: GameResult): boolean {
  return !result.label.trim().startsWith("X") && result.label.trim() !== "Gave up";
}

export function syncBestStreak(current: number): void {
  const stats = loadPlayerStats();
  if (current > stats.bestStreak) {
    stats.bestStreak = current;
    save(stats);
  }
}

export function recordGameResult(gameId: GameId, result: GameResult): void {
  const stats = loadPlayerStats();
  const today = getTodayKey();
  const won = isWin(result);

  if (today !== stats.lastRecordedDay) {
    stats.daysPlayed += 1;
    stats.lastRecordedDay = today;
  }

  if (won) stats.gamesWon += 1;
  else stats.gamesLost += 1;

  if (gameId === "verbum") {
    if (won) {
      stats.verbumWins += 1;
      const match = result.label.match(/^(\d+)\s*\//);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < 6) stats.verbumDistribution[idx] += 1;
      }
    } else {
      stats.verbumLosses += 1;
    }
  } else if (gameId === "pitch") {
    if (won) {
      stats.pitchWins += 1;
      const match = result.label.match(/^(\d+)\s*\//);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < 6) stats.pitchDistribution[idx] += 1;
      }
    } else {
      stats.pitchLosses += 1;
    }
  } else if (gameId === "ratio") {
    stats.ratioPlays += 1;
    const match = result.label.match(/^(\d+)\s*\/\s*(\d+)/);
    if (match) {
      const score = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (score > stats.ratioHighScore) {
        stats.ratioHighScore = score;
      }
      if (score === total) {
        stats.ratioWins += 1; // perfect run
      }
    }
  } else if (gameId === "context") {
    if (won) {
      stats.contextWins += 1;
      const guessCount = parseInt(result.label, 10);
      if (!isNaN(guessCount)) {
        stats.contextGuessesSum += guessCount;
      }
    } else {
      stats.contextLosses += 1;
    }
  }

  save(stats);
}

export function getVerbumAvgGuess(stats: PlayerStats): string {
  if (stats.verbumWins === 0) return "—";
  const sum = stats.verbumDistribution.reduce((acc, count, i) => acc + count * (i + 1), 0);
  return (sum / stats.verbumWins).toFixed(1);
}

export function getPitchAvgGuess(stats: PlayerStats): string {
  if (stats.pitchWins === 0) return "—";
  const sum = stats.pitchDistribution.reduce((acc, count, i) => acc + count * (i + 1), 0);
  return (sum / stats.pitchWins).toFixed(1);
}

export function getContextAvgGuess(stats: PlayerStats): string {
  if (stats.contextWins === 0) return "—";
  return (stats.contextGuessesSum / stats.contextWins).toFixed(1);
}

export function getGameWinRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

export function getWinRate(stats: PlayerStats): string {
  const total = stats.gamesWon + stats.gamesLost;
  if (total === 0) return "—";
  return `${Math.round((stats.gamesWon / total) * 100)}%`;
}
