import { createRouteHandler } from "@/lib/supabase/route-handler";
import { ensureOverridesLoaded } from "@/lib/daily-overrides-store.server";
import { getTodayContextTarget } from "@/games/content/context-engine";
import { getContextPuzzleNumber } from "@/games/content/context-puzzles";

const POST = createRouteHandler({ auth: "none" }, async () => {
  try {
    await ensureOverridesLoaded();
    return Response.json({
      puzzleNumber: getContextPuzzleNumber(),
      answer: getTodayContextTarget(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CONTEXT engine error";
    return Response.json({ message, code: "ENGINE_ERROR" }, { status: 503 });
  }
});

export { POST };
