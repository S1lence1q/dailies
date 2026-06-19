"use client";

import { FONT } from "@/lib/typography";
import { motion } from "motion/react";
import type { GameStatus } from "@/games/types";

interface GameIntroProps {
  name: string;
  tagline: string;
  fg: string;
  accent: string;
  status: GameStatus;
  onStart?: () => void;
}

export function GameIntro({ name, tagline, fg, accent, status, onStart }: GameIntroProps) {
  const isLive = status === "live";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        textAlign: "center",
      }}
    >
      <motion.h1
        style={{
          fontFamily: FONT.fraunces,
          fontWeight: 900,
          fontStyle: "italic",
          color: fg,
          fontSize: "clamp(4rem, 18vw, 9rem)",
          lineHeight: 0.85,
          letterSpacing: "-0.03em",
          marginBottom: "32px",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {name}
      </motion.h1>

      <motion.div
        style={{
          width: "36px",
          height: "1px",
          backgroundColor: accent,
          opacity: 0.3,
          marginBottom: "24px",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />

      <motion.p
        style={{
          fontFamily: FONT.sans,
          fontSize: "0.95rem",
          color: accent,
          maxWidth: "280px",
          lineHeight: 1.7,
          marginBottom: "36px",
          opacity: 0.75,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {tagline}
      </motion.p>

      {isLive ? (
        <motion.button
          type="button"
          onClick={onStart}
          style={{
            padding: "10px 24px",
            border: `1px solid ${accent}`,
            background: "transparent",
            fontFamily: FONT.mono,
            fontSize: "0.62rem",
            color: fg,
            letterSpacing: "0.16em",
            cursor: "pointer",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          whileHover={{ backgroundColor: `${accent}22` }}
          whileTap={{ scale: 0.98 }}
        >
          PLAY TODAY
        </motion.button>
      ) : (
        <motion.div
          style={{
            padding: "7px 20px",
            border: `1px solid ${accent}`,
            fontFamily: FONT.mono,
            fontSize: "0.62rem",
            color: accent,
            letterSpacing: "0.16em",
            opacity: 0.4,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          COMING SOON
        </motion.div>
      )}
    </div>
  );
}

/** @deprecated Use GameIntro */
export const ComingSoon = GameIntro;
