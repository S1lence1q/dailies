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
};

interface HowToPlayProps {
  gameId: string;
  fg: string;
  accent: string;
  onClose: () => void;
}

export function HowToPlay({ gameId, fg, accent, onClose }: HowToPlayProps) {
  const rules = GAME_RULES[gameId];
  if (!rules) return null;

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        style={{ width: "100%", maxWidth: "340px" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ delay: 0.04, duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
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
          <button
            onClick={onClose}
            style={{
              color: fg,
              opacity: 0.4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
          >
            <X size={15} />
          </button>
        </div>

        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rules.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: i < rules.steps.length - 1 ? "12px" : "0",
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color: accent,
                  width: "14px",
                  flexShrink: 0,
                  paddingTop: "2px",
                  opacity: 0.7,
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{
                  fontFamily: FONT.sans,
                  fontSize: "0.88rem",
                  color: fg,
                  lineHeight: 1.55,
                  opacity: 0.88,
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
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: `1px solid ${fg}14`,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
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
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: `1px solid ${fg}14`,
          }}
        >
          <p
            style={{
              fontFamily: FONT.sans,
              fontSize: "0.82rem",
              fontStyle: "italic",
              color: fg,
              opacity: 0.42,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {rules.tip}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
