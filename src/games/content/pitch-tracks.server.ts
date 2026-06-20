import "server-only";

import { getTodayKey } from "@/lib/daily";
import { getOverridesForDate } from "@/lib/daily-overrides-store.server";
import { pickById } from "@/lib/daily-content";
import { PITCH_TRACKS, type PitchTrack } from "@/games/content/pitch-tracks";

export function getPitchTrackForDate(date = getTodayKey()): PitchTrack {
  const { pitch } = getOverridesForDate(date);
  return pickById(PITCH_TRACKS, date, pitch);
}
