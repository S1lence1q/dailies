interface ItunesTrackResult {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesTrackResult[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(result: ItunesTrackResult, artist: string, title: string): number {
  const rArtist = normalize(result.artistName);
  const rTitle = normalize(result.trackName);
  const targetArtist = normalize(artist);
  const targetTitle = normalize(title);

  let score = 0;
  if (rTitle.includes(targetTitle) || targetTitle.includes(rTitle)) score += 3;
  if (rArtist.includes(targetArtist) || targetArtist.includes(rArtist)) score += 2;
  if (result.previewUrl) score += 1;
  return score;
}

export async function fetchItunesPreview(
  artist: string,
  title: string,
  trackId?: number,
): Promise<{ previewUrl: string; artistName: string; trackName: string; artworkUrl?: string } | null> {
  if (trackId) {
    const lookupUrl = `https://itunes.apple.com/lookup?id=${trackId}&entity=song`;
    const res = await fetch(lookupUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = (await res.json()) as ItunesSearchResponse;
      const hit = data.results?.find((r) => r.previewUrl);
      if (hit?.previewUrl) {
        return {
          previewUrl: hit.previewUrl,
          artistName: hit.artistName,
          trackName: hit.trackName,
          artworkUrl: hit.artworkUrl100,
        };
      }
    }
  }

  const term = encodeURIComponent(`${artist} ${title}`);
  const searchUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=12`;
  const res = await fetch(searchUrl, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = (await res.json()) as ItunesSearchResponse;
  const candidates = (data.results ?? [])
    .filter((r) => r.previewUrl)
    .map((r) => ({ result: r, score: scoreMatch(r, artist, title) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0]?.result;
  if (!best?.previewUrl) return null;

  return {
    previewUrl: best.previewUrl,
    artistName: best.artistName,
    trackName: best.trackName,
    artworkUrl: best.artworkUrl100,
  };
}

function tokenMatches(guessPart: string, target: string): boolean {
  const p = normalize(guessPart).replace(/\s/g, "");
  const t = normalize(target);
  const compact = t.replace(/\s/g, "");
  if (!p) return false;
  return p.includes(compact) || compact.includes(p) || t.split(" ").every((w) => w.length > 0 && p.includes(w));
}

export type PitchGuessResult = "correct" | "artist" | "wrong";

export function matchesPitchArtist(
  guess: string,
  artist: string,
  aliases: string[] = [],
): boolean {
  const parts = guess.split(/\s*[—–\-|]\s*/).map((p) => normalize(p)).filter(Boolean);
  const artists = [normalize(artist), ...aliases.map(normalize)];

  if (parts.length >= 2) {
    return parts.some((p) =>
      artists.some((a) => tokenMatches(p, a) || a.includes(p) || p.includes(a.replace(/\s/g, ""))),
    );
  }

  const g = normalize(guess);
  return artists.some((a) => tokenMatches(g, a));
}

export function matchesPitchTitle(
  guess: string,
  title: string,
  aliases: string[] = [],
): boolean {
  const parts = guess.split(/\s*[—–\-|]\s*/).map((p) => normalize(p)).filter(Boolean);
  const titles = [normalize(title), ...aliases.map(normalize)];

  if (parts.length >= 2) {
    return parts.some((p) =>
      titles.some((t) => tokenMatches(p, t) || t.includes(p) || p.includes(t.replace(/\s/g, ""))),
    );
  }

  const g = normalize(guess);
  return titles.some((t) => tokenMatches(g, t));
}

export function evaluatePitchGuess(
  guess: string,
  artist: string,
  title: string,
  aliases: string[] = [],
): PitchGuessResult {
  if (matchesPitchGuess(guess, artist, title, aliases)) return "correct";
  if (matchesPitchArtist(guess, artist, aliases) && !matchesPitchTitle(guess, title, aliases)) {
    return "artist";
  }
  return "wrong";
}

export function matchesPitchGuess(
  guess: string,
  artist: string,
  title: string,
  aliases: string[] = [],
): boolean {
  const g = normalize(guess).replace(/\s/g, "");
  if (!g) return false;

  const parts = guess.split(/\s*[—–\-|]\s*/).map((p) => normalize(p)).filter(Boolean);
  if (parts.length >= 2) {
    const artistNorm = normalize(artist);
    const titleNorm = normalize(title);
    const artistHit = parts.some(
      (p) => artistNorm.includes(p) || p.includes(artistNorm.replace(/\s/g, "")),
    );
    const titleHit = parts.some(
      (p) => titleNorm.includes(p) || p.includes(titleNorm.replace(/\s/g, "")),
    );
    if (artistHit && titleHit) return true;
  }

  const tokens = [normalize(artist), normalize(title), ...aliases.map(normalize)];

  return tokens.some((token) => {
    const compact = token.replace(/\s/g, "");
    return g.includes(compact) || compact.includes(g) || token.split(" ").every((w) => g.includes(w));
  });
}

export interface SongSuggestion {
  artist: string;
  title: string;
  label: string;
  artworkUrl?: string;
}

export async function searchItunesSongs(query: string, limit = 8): Promise<SongSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const term = encodeURIComponent(trimmed);
  const searchUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=${limit}`;
  const res = await fetch(searchUrl, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = (await res.json()) as ItunesSearchResponse;
  const seen = new Set<string>();

  return (data.results ?? [])
    .filter((r) => r.trackName && r.artistName)
    .map((r) => ({
      artist: r.artistName,
      title: r.trackName,
      label: `${r.artistName} — ${r.trackName}`,
      artworkUrl: r.artworkUrl100,
    }))
    .filter((s) => {
      const key = s.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
