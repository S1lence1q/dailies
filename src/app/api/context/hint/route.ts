import { createRouteHandler } from "@/lib/supabase/route-handler";
import { ensureOverridesLoaded } from "@/lib/daily-overrides-store.server";
import { getContextWordHint } from "@/games/content/context-engine";
import { getContextPuzzleNumber } from "@/games/content/context-puzzles";

const MAX_HINTS = 3;

const POST = createRouteHandler({ auth: "none" }, async (req) => {
  let body: { guessed?: string[]; hintWords?: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const guessed = Array.isArray(body.guessed)
    ? body.guessed.map((w) => w.toLowerCase())
    : [];
  const hintWords = Array.isArray(body.hintWords)
    ? body.hintWords.map((w) => w.toLowerCase())
    : [];

  if (hintWords.length >= MAX_HINTS) {
    return Response.json(
      { message: "No hints left today", code: "NO_HINTS_LEFT" },
      { status: 400 },
    );
  }

  await ensureOverridesLoaded();
  const hint = getContextWordHint(guessed, hintWords);
  if (!hint) {
    return Response.json(
      { message: "You're already very close — keep guessing!", code: "NO_HINT" },
      { status: 404 },
    );
  }

  return Response.json({
    puzzleNumber: getContextPuzzleNumber(),
    word: hint.word,
    rank: hint.rank,
    hintsLeft: MAX_HINTS - hintWords.length - 1,
  });
});

export { POST };
