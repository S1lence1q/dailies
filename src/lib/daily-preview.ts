import "server-only";

import { getDayIndex, getPuzzleNumber, getTodayKey } from "@/lib/daily";
import { getOverridesForDate, ensureOverridesLoaded } from "@/lib/daily-overrides-store.server";
import { pickById, pickByTarget, pickByWord } from "@/lib/daily-content";
import { CONTEXT_PUZZLES } from "@/games/content/context-puzzles";
import { PITCH_TRACKS } from "@/games/content/pitch-tracks";
import { RATIO_PUZZLES } from "@/games/content/ratio-puzzles";
import { VERBUM_WORDS } from "@/games/content/verbum-words";
import type { DailyOverrides } from "@/games/content/daily-manifest";

export type DaySchedulePreview = {
  date: string;
  puzzleNumbers: {
    verbum: number;
    pitch: number;
    ratio: number;
    context: number;
  };
  auto: {
    verbum: string;
    context: string;
    pitch: string;
    ratio: string;
  };
  override: DailyOverrides | null;
  effective: {
    verbum: string;
    context: string;
    pitch: string;
    ratio: string;
    pitchId: number;
    ratioId: number;
  };
};

function autoForDate(date: string): DaySchedulePreview["auto"] {
  const verbum = pickByWord(VERBUM_WORDS, date);
  const context = pickByTarget(CONTEXT_PUZZLES, date).target;
  const pitchTrack = pickById(PITCH_TRACKS, date);
  const ratioPuzzle = pickById(RATIO_PUZZLES, date);
  return {
    verbum,
    context,
    pitch: `${pitchTrack.artist} — ${pitchTrack.title}`,
    ratio: `Chain #${ratioPuzzle.id}`,
  };
}

function effectiveForDate(date: string): DaySchedulePreview["effective"] {
  const o = getOverridesForDate(date);
  const verbum = pickByWord(VERBUM_WORDS, date, o.verbum);
  const context = pickByTarget(CONTEXT_PUZZLES, date, o.context, (target) => ({
    id: 0,
    target,
    theme: "",
    hint: "",
  })).target;
  const pitchTrack = pickById(PITCH_TRACKS, date, o.pitch);
  const ratioPuzzle = pickById(RATIO_PUZZLES, date, o.ratio);

  return {
    verbum,
    context,
    pitch: `${pitchTrack.artist} — ${pitchTrack.title}`,
    ratio: `Chain #${ratioPuzzle.id}`,
    pitchId: pitchTrack.id,
    ratioId: ratioPuzzle.id,
  };
}

export function buildDayPreview(date: string): DaySchedulePreview {
  const overrideRaw = getOverridesForDate(date);
  const hasOverride = Object.keys(overrideRaw).length > 0;
  return {
    date,
    puzzleNumbers: {
      verbum: getPuzzleNumber(847, date),
      pitch: getPuzzleNumber(412, date),
      ratio: getPuzzleNumber(203, date),
      context: getDayIndex(date) + 631,
    },
    auto: autoForDate(date),
    override: hasOverride ? overrideRaw : null,
    effective: effectiveForDate(date),
  };
}

export async function buildDayRange(from: string, days: number): Promise<DaySchedulePreview[]> {
  await ensureOverridesLoaded();
  const out: DaySchedulePreview[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    out.push(buildDayPreview(key));
  }
  return out;
}

export async function buildClientSchedule(date = getTodayKey()) {
  await ensureOverridesLoaded();
  const effective = effectiveForDate(date);
  return {
    date,
    verbum: effective.verbum,
    pitchId: effective.pitchId,
    ratioId: effective.ratioId,
  };
}
