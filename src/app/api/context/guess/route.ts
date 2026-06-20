import { createRouteHandler } from "@/lib/supabase/route-handler";
import { ensureOverridesLoaded } from "@/lib/daily-overrides-store.server";
import {
  getContextVocabularySize,
  lookupContextRank,
  normalizeContextGuess,
} from "@/games/content/context-engine";
import { getContextPuzzleNumber } from "@/games/content/context-puzzles";

const POST = createRouteHandler({ auth: "none" }, async (req) => {
  let body: { guess?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body", code: "INVALID_BODY" }, { status: 400 });
  }

  const guess = normalizeContextGuess(body.guess ?? "");
  if (!guess) {
    return Response.json(
      { message: "Enter a single English word (letters only)", code: "INVALID_GUESS" },
      { status: 400 },
    );
  }

  try {
    await ensureOverridesLoaded();
    const { rank, resolvedWord, vocabularySize } = lookupContextRank(guess);

    if (rank === null || resolvedWord === null) {
      return Response.json({
        puzzleNumber: getContextPuzzleNumber(),
        guess,
        known: false,
        rank: null,
        won: false,
        vocabularySize: getContextVocabularySize(),
      });
    }

    return Response.json({
      puzzleNumber: getContextPuzzleNumber(),
      guess: resolvedWord,
      known: true,
      rank,
      won: rank === 1,
      vocabularySize,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CONTEXT engine error";
    return Response.json({ message, code: "ENGINE_ERROR" }, { status: 503 });
  }
});

export { POST };
