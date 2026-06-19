"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { VerbumGame } from "./VerbumGame";
import { PitchGame } from "./PitchGame";
import { RatioGame } from "./RatioGame";
import { GameIntro } from "./GameIntro";
import { getGame } from "@/games/registry";
import { markIntroSeenToday, shouldShowIntro } from "@/lib/game-intro";
import type { GameId, GamePlayerProps } from "@/games/types";

function LiveGame({
  gameId,
  streak,
  onComplete,
}: GamePlayerProps & { gameId: GameId }) {
  switch (gameId) {
    case "verbum":
      return <VerbumGame streak={streak} onComplete={onComplete} />;
    case "pitch":
      return <PitchGame streak={streak} onComplete={onComplete} />;
    case "ratio":
      return <RatioGame streak={streak} onComplete={onComplete} />;
    default:
      return null;
  }
}

export function GamePlayer({ gameId, streak, onComplete }: GamePlayerProps & { gameId: GameId }) {
  const game = getGame(gameId);
  const [started, setStarted] = useState(() => !shouldShowIntro(gameId));

  const handleStart = useCallback(() => {
    markIntroSeenToday(gameId);
    setStarted(true);
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

  return (
    <AnimatePresence mode="wait">
      {!started ? (
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
            onStart={handleStart}
          />
        </motion.div>
      ) : (
        <motion.div
          key="game"
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <LiveGame gameId={gameId} streak={streak} onComplete={onComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
