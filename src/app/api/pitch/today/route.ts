import { createRouteHandler } from "@/lib/supabase/route-handler";
import { ensureOverridesLoaded } from "@/lib/daily-overrides-store.server";
import { fetchItunesPreview } from "@/lib/itunes";
import {
  getPitchPuzzleNumber,
} from "@/games/content/pitch-tracks";
import { getPitchTrackForDate } from "@/games/content/pitch-tracks.server";

const GET = createRouteHandler({ auth: "none" }, async () => {
  await ensureOverridesLoaded();
  const track = getPitchTrackForDate();
  const preview = await fetchItunesPreview(track.artist, track.title, track.itunesTrackId);

  if (!preview) {
    return Response.json(
      { message: "Could not load preview for today's track", code: "PREVIEW_UNAVAILABLE" },
      { status: 503 },
    );
  }

  return Response.json({
    puzzleNumber: getPitchPuzzleNumber(),
    previewUrl: preview.previewUrl,
    artist: track.artist,
    title: track.title,
    aliases: track.aliases ?? [],
    displayArtist: preview.artistName,
    displayTitle: preview.trackName,
    artworkUrl: preview.artworkUrl,
  });
});

export { GET };
