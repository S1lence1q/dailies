"use client";

import { FONT } from "@/lib/typography";
import { motion } from "motion/react";
import type { GameStatus } from "@/games/types";
import { GAME_RULES } from "./HowToPlay";

interface GameIntroProps {
  name: string;
  tagline: string;
  fg: string;
  accent: string;
  status: GameStatus;
  gameId?: string;
  /** First-time rules inline below tagline — one PLAY tap starts the game */
  showRules?: boolean;
  onStart?: () => void;
}

function IntroRules({
  gameId,
  fg,
  accent,
}: {
  gameId: string;
  fg: string;
  accent: string;
}) {
  const rules = GAME_RULES[gameId];
  if (!rules) return null;

  return (
    <motion.div
      style={{
        width: "100%",
        maxWidth: "300px",
        marginBottom: "28px",
        textAlign: "left",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.35 }}
    >
      <p
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.58rem",
          color: accent,
          letterSpacing: "0.14em",
          marginBottom: "14px",
          opacity: 0.65,
          textAlign: "center",
        }}
      >
        HOW TO PLAY
      </p>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rules.steps.map((step, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: i < rules.steps.length - 1 ? "10px" : 0,
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.58rem",
                color: accent,
                width: "12px",
                flexShrink: 0,
                paddingTop: "2px",
                opacity: 0.6,
              }}
            >
              {i + 1}.
            </span>
            <span
              style={{
                fontFamily: FONT.sans,
                fontSize: "0.82rem",
                color: fg,
                lineHeight: 1.5,
                opacity: 0.72,
              }}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
      {rules.legend && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: `1px solid ${accent}28`,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {rules.legend.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: item.color,
                  borderRadius: "2px",
                  flexShrink: 0,
                  border: item.color.includes("rgba") ? `1px solid ${fg}20` : "none",
                }}
              />
              <span
                style={{
                  fontFamily: FONT.sans,
                  fontSize: "0.72rem",
                  color: fg,
                  opacity: 0.55,
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function GameIntro({
  name,
  tagline,
  fg,
  accent,
  status,
  gameId,
  showRules,
  onStart,
}: GameIntroProps) {
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
        overflowY: "auto",
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
          marginBottom: showRules && gameId ? "24px" : "36px",
          opacity: 0.75,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {tagline}
      </motion.p>

      {showRules && gameId && (
        <IntroRules gameId={gameId} fg={fg} accent={accent} />
      )}

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
            flexShrink: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: showRules ? 0.4 : 0.35, duration: 0.4 }}
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
