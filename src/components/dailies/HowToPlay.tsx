"use client";

import { FONT } from "@/lib/typography";
import { X } from "lucide-react";
import { motion } from "motion/react";

export const GAME_RULES: Record<
  string,
  {
    steps: string[];
    legend?: Array<{ color: string; label: string }>;
    tip: string;
  }
> = {
  verbum: {
    steps: [
      "Guess the 5-letter word in 6 tries.",
      "Each guess must be a valid 5-letter word.",
      "Tile colors update after every guess.",
    ],
    legend: [
      { color: "#3D9B5C", label: "Right letter, right position" },
      { color: "#B8910A", label: "Right letter, wrong position" },
      { color: "rgba(213,234,216,0.12)", label: "Letter not in the word" },
    ],
    tip: "Start with words rich in common letters: E, A, R, I, O, T, S.",
  },
  pitch: {
    steps: [
      "Press play to hear today's clip — you can replay it anytime.",
      "Clips start at 0.1s and grow longer each skip.",
      "Search for the artist or song, then submit your guess.",
      "You have 6 attempts.",
    ],
    tip: "Skipping without guessing is a valid strategy. Sometimes a few more seconds is all you need.",
  },
  ratio: {
    steps: [
      "You're shown one thing with its number revealed.",
      "Guess if the next thing is higher or lower.",
      "Units don't have to match — that's the point.",
      "One wrong guess ends your run.",
    ],
    tip: "Don't trust your gut on absurd comparisons. Read the number, then decide.",
  },
  context: {
    steps: [
      "Guess any word to probe today's hidden answer.",
      "Each guess gets a rank — lower means closer in meaning.",
      "Your guesses sort by rank so your best leads stay on top.",
      "Tap the lightbulb for a closer word — you'll confirm before it's submitted.",
      "Stuck? Use the ··· menu to give up and see the answer.",
    ],
    tip: "Start broad (season, weather, place) then narrow down from your warmest ranks.",
  },
};

interface HowToPlayProps {
  gameId: string;
  fg: string;
  accent: string;
  bg: string;
  /** Full panel (first visit) vs overlay (? button) */
  variant?: "screen" | "overlay";
  onClose: () => void;
}

export function HowToPlay({
  gameId,
  fg,
  accent,
  bg,
  variant = "screen",
  onClose,
}: HowToPlayProps) {
  const rules = GAME_RULES[gameId];
  if (!rules) return null;

  const isOverlay = variant === "overlay";

  return (
    <motion.div
      className={isOverlay ? "absolute inset-0 z-20 flex flex-col" : "flex flex-1 flex-col"}
      style={{ backgroundColor: bg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={isOverlay ? onClose : undefined}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "32px 28px",
          maxWidth: "400px",
          margin: "0 auto",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.65rem",
              color: accent,
              letterSpacing: "0.14em",
            }}
          >
            HOW TO PLAY
          </span>
          {isOverlay && (
            <button
              type="button"
              onClick={onClose}
              style={{
                color: fg,
                opacity: 0.4,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rules.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: i < rules.steps.length - 1 ? "14px" : "0",
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color: accent,
                  width: "14px",
                  flexShrink: 0,
                  paddingTop: "3px",
                  opacity: 0.75,
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{
                  fontFamily: FONT.sans,
                  fontSize: "0.92rem",
                  color: fg,
                  lineHeight: 1.55,
                  opacity: 0.9,
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
              marginTop: "22px",
              paddingTop: "20px",
              borderTop: `1px solid ${accent}28`,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {rules.legend.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    backgroundColor: item.color,
                    borderRadius: "2px",
                    flexShrink: 0,
                    border: item.color.includes("rgba") ? `1px solid ${fg}20` : "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: "0.8rem",
                    color: fg,
                    opacity: 0.65,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: `1px solid ${accent}28`,
          }}
        >
          <p
            style={{
              fontFamily: FONT.sans,
              fontSize: "0.82rem",
              fontStyle: "italic",
              color: fg,
              opacity: 0.45,
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}
          >
            {rules.tip}
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 0",
              border: `1px solid ${accent}`,
              background: `${accent}18`,
              fontFamily: FONT.mono,
              fontSize: "0.65rem",
              color: fg,
              letterSpacing: "0.14em",
              cursor: "pointer",
            }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </motion.div>
  );
}
