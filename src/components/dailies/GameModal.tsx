"use client";

import { ReactNode, useState, useCallback } from "react";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FONT } from "@/lib/typography";
import { HowToPlay, GAME_RULES } from "./HowToPlay";
import type { GameId } from "@/games/types";

interface GameModalProps {
  name: string;
  number: number;
  genre: string;
  bg: string;
  fg: string;
  accent: string;
  gameId?: GameId;
  /** Minimal header: back + meta only, no game title */
  compactHeader?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function GameModal({
  name,
  number,
  genre,
  bg,
  fg,
  accent,
  gameId,
  compactHeader = false,
  onClose,
  children,
}: GameModalProps) {
  const [showHelp, setShowHelp] = useState(false);
  const hasRules = gameId ? Boolean(GAME_RULES[gameId]) : false;

  const closeHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: bg }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ type: "spring", damping: 28, stiffness: 240 }}
    >
      <header
        style={{
          height: "52px",
          borderBottom: `1px solid ${accent}28`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: accent,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT.mono,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            padding: "4px 0",
            opacity: 0.75,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
        >
          <ArrowLeft size={13} />
          Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {!compactHeader && (
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: accent,
                letterSpacing: "0.1em",
                opacity: 0.65,
              }}
            >
              {genre.toUpperCase()} · NO. {number}
            </span>
          )}

          {!compactHeader && (
            <span
              style={{
                fontFamily: FONT.fraunces,
                color: fg,
                fontSize: "1.05rem",
                fontWeight: 700,
                fontStyle: "italic",
                letterSpacing: "-0.03em",
              }}
            >
              {name}
            </span>
          )}

          {hasRules && (
            <button
              onClick={() => setShowHelp(true)}
              style={{
                display: "flex",
                alignItems: "center",
                color: accent,
                opacity: 0.5,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              aria-label="How to play"
            >
              <HelpCircle size={15} />
            </button>
          )}
        </div>
      </header>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {!showHelp && children}

        <AnimatePresence>
          {showHelp && gameId && (
            <HowToPlay
              key="help"
              gameId={gameId}
              fg={fg}
              accent={accent}
              bg={bg}
              variant="overlay"
              onClose={closeHelp}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
