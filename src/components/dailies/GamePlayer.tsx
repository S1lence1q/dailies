"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { VerbumGame } from "./VerbumGame";
import { PitchGame } from "./PitchGame";
import { RatioGame } from "./RatioGame";
import { ContextGame } from "./ContextGame";
import { GameIntro } from "./GameIntro";
import { getGame } from "@/games/registry";
import { markIntroSeenToday, shouldShowIntro } from "@/lib/game-intro";
import { markRulesSeen, shouldShowRules } from "@/lib/game-rules";
import type { GameId, GamePlayerProps } from "@/games/types";

type Phase = "loading" | "intro" | "game";

function resolvePhase(gameId: GameId): Phase {
  if (shouldShowIntro(gameId)) return "intro";
  return "game";
}

function LiveGame({
  gameId,
  streak,
  played,
  onComplete,
  onPlayNext,
  onBackToLineup,
}: GamePlayerProps & { gameId: GameId }) {
  switch (gameId) {
    case "verbum":
      return (
        <VerbumGame
          streak={streak}
          played={played}
          onComplete={onComplete}
          onPlayNext={onPlayNext}
          onBackToLineup={onBackToLineup}
        />
      );
    case "pitch":
      return (
        <PitchGame
          streak={streak}
          played={played}
          onComplete={onComplete}
          onPlayNext={onPlayNext}
          onBackToLineup={onBackToLineup}
        />
      );
    case "ratio":
      return (
        <RatioGame
          streak={streak}
          played={played}
          onComplete={onComplete}
          onPlayNext={onPlayNext}
          onBackToLineup={onBackToLineup}
        />
      );
    case "context":
      return (
        <ContextGame
          streak={streak}
          played={played}
          onComplete={onComplete}
          onPlayNext={onPlayNext}
          onBackToLineup={onBackToLineup}
        />
      );
    default:
      return null;
  }
}

export function GamePlayer({
  gameId,
  streak,
  played,
  onComplete,
  onPlayNext,
  onBackToLineup,
}: GamePlayerProps & { gameId: GameId }) {
  const game = getGame(gameId);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    setPhase(resolvePhase(gameId));
  }, [gameId]);

  const handleStart = useCallback(() => {
    markIntroSeenToday(gameId);
    if (shouldShowRules(gameId)) {
      markRulesSeen(gameId);
    }
    setPhase("game");
  }, [gameId]);

  if (!game) return null;

  if (game.status !== "live") {
    return (
      <GameIntro
        name={game.name}
        tagline={game.comingSoonTagline ?? game.tagline}
        fg={game.fg}
        accent={game.accent}
        status={game.status}
      />
    );
  }

  if (phase === "loading") {
    return <div style={{ flex: 1, backgroundColor: game.bg }} />;
  }

  return (
    <AnimatePresence mode="wait">
      {phase === "intro" && (
        <motion.div
          key="intro"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <GameIntro
            name={game.name}
            tagline={game.tagline}
            fg={game.fg}
            accent={game.accent}
            status="live"
            gameId={gameId}
            showRules={shouldShowRules(gameId)}
            onStart={handleStart}
          />
        </motion.div>
      )}

      {phase === "game" && (
        <motion.div
          key="game"
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <LiveGame
            gameId={gameId}
            streak={streak}
            played={played}
            onComplete={onComplete}
            onPlayNext={onPlayNext}
            onBackToLineup={onBackToLineup}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
