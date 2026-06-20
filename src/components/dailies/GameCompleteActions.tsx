"use client";

import { Share2, ArrowRight, ArrowLeft } from "lucide-react";
import { FONT } from "@/lib/typography";
import { getNextUnplayedGame, VISIBLE_GAMES } from "@/games/registry";
import type { GameId } from "@/games/types";

interface GameCompleteActionsProps {
  gameId: GameId;
  played: Set<string>;
  fg: string;
  accent: string;
  shareBg?: string;
  shareFg?: string;
  onShare: () => void;
  onPlayNext?: (id: GameId) => void;
  onBackToLineup?: () => void;
}

export function GameCompleteActions({
  gameId,
  played,
  fg,
  accent,
  shareBg,
  shareFg,
  onShare,
  onPlayNext,
  onBackToLineup,
}: GameCompleteActionsProps) {
  const doneIds = new Set([...played, gameId]);
  const liveGames = VISIBLE_GAMES.filter((g) => g.status === "live");
  const doneCount = liveGames.filter((g) => doneIds.has(g.id)).length;
  const next = getNextUnplayedGame(gameId, played);
  const allDone = doneCount >= liveGames.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        width: "100%",
      }}
    >
      <p
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.62rem",
          color: accent,
          letterSpacing: "0.12em",
          opacity: 0.65,
          margin: 0,
        }}
      >
        {allDone ? "ALL DONE FOR TODAY" : `${doneCount} OF ${liveGames.length} DONE TODAY`}
      </p>

      {next && !allDone && (
        <p
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.58rem",
            color: accent,
            letterSpacing: "0.14em",
            opacity: 0.5,
            margin: 0,
          }}
        >
          NEXT · {next.name}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={onShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 18px",
            backgroundColor: shareBg ?? fg,
            color: shareFg ?? accent,
            border: shareBg ? "none" : `1px solid ${accent}44`,
            borderRadius: "2px",
            fontFamily: FONT.mono,
            fontSize: "0.72rem",
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          <Share2 size={11} />
          Share
        </button>

        {next && onPlayNext && !allDone && (
          <button
            type="button"
            onClick={() => onPlayNext(next.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "transparent",
              color: fg,
              border: `1px solid ${next.accent}`,
              borderRadius: "2px",
              fontFamily: FONT.mono,
              fontSize: "0.72rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            Continue
            <ArrowRight size={12} />
          </button>
        )}

        {allDone && onBackToLineup && (
          <button
            type="button"
            onClick={onBackToLineup}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "transparent",
              color: fg,
              border: `1px solid ${accent}66`,
              borderRadius: "2px",
              fontFamily: FONT.mono,
              fontSize: "0.72rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            <ArrowLeft size={11} />
            Back to lineup
          </button>
        )}
      </div>
    </div>
  );
}
