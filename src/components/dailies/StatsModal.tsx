"use client";

import { FONT } from "@/lib/typography";
import { X, Check, Flame } from "lucide-react";
import { motion } from "motion/react";

import { VISIBLE_GAMES } from "@/games/registry";
import type { GameResult } from "@/games/types";

const BEST_STREAK = 18;
const TOTAL_PLAYED = 243;
const WIN_RATE = 94;
const AVG_GUESS = 3.4;
const VERBUM_DISTRIBUTION = [2, 4, 9, 6, 3, 1];

const GAME_META = VISIBLE_GAMES.map((g) => ({
  id: g.id,
  short: g.name,
  bg: g.bg,
  fg: g.accent,
}));

interface StatsModalProps {
  streak: number;
  played: Set<string>;
  results: Record<string, GameResult | null>;
  onClose: () => void;
}

function Rule() {
  return <div style={{ height: "1px", backgroundColor: "rgba(240,235,225,0.07)" }} />;
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <span
        style={{
          fontFamily: FONT.fraunces,
          fontSize: "1.7rem",
          fontWeight: 700,
          fontStyle: "italic",
          color: "#F0EBE1",
          display: "block",
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.6rem",
          color: "rgba(240,235,225,0.3)",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function DistBar({
  index,
  count,
  max,
  highlight,
}: {
  index: number;
  count: number;
  max: number;
  highlight: boolean;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 4) : 4;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.65rem",
          color: "rgba(240,235,225,0.3)",
          width: "10px",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      <div
        style={{
          flex: 1,
          height: "18px",
          backgroundColor: "rgba(240,235,225,0.05)",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            backgroundColor: highlight ? "#3D9B5C" : "rgba(240,235,225,0.18)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.2 + index * 0.055, duration: 0.45, ease: "easeOut" }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.65rem",
          color: highlight ? "#3D9B5C" : "rgba(240,235,225,0.3)",
          width: "14px",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </div>
  );
}

export function StatsModal({ streak, played, results, onClose }: StatsModalProps) {
  const verbumLabel = results.verbum?.label ?? "";
  const verbumGuessMatch = verbumLabel.match(/^(\d+)\s*\//);
  const verbumGuessIndex = verbumGuessMatch ? parseInt(verbumGuessMatch[1]) - 1 : null;
  const verbumWon = verbumGuessIndex !== null;
  const distMax = Math.max(...VERBUM_DISTRIBUTION);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#18120e]/60" />

      <motion.div
        className="relative w-full sm:max-w-[420px] overflow-hidden"
        style={{ backgroundColor: "#18120E" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(240,235,225,0.08)",
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.68rem",
              color: "rgba(240,235,225,0.38)",
              letterSpacing: "0.12em",
            }}
          >
            YOUR STATS
          </span>
          <button
            onClick={onClose}
            style={{
              color: "rgba(240,235,225,0.35)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "0" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "5px" }}>
                <span
                  style={{
                    fontFamily: FONT.fraunces,
                    fontSize: "4.8rem",
                    fontWeight: 900,
                    fontStyle: "italic",
                    color: "#F0EBE1",
                    lineHeight: 0.9,
                  }}
                >
                  {streak}
                </span>
                <Flame size={18} style={{ color: "#C84820", marginBottom: "6px", flexShrink: 0 }} />
              </div>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color: "rgba(240,235,225,0.32)",
                  letterSpacing: "0.1em",
                }}
              >
                CURRENT
              </span>
            </div>

            <div
              style={{
                width: "1px",
                backgroundColor: "rgba(240,235,225,0.08)",
                margin: "4px 24px",
                alignSelf: "stretch",
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "5px" }}>
                <span
                  style={{
                    fontFamily: FONT.fraunces,
                    fontSize: "4.8rem",
                    fontWeight: 900,
                    fontStyle: "italic",
                    color: "rgba(240,235,225,0.28)",
                    lineHeight: 0.9,
                  }}
                >
                  {BEST_STREAK}
                </span>
              </div>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color: "rgba(240,235,225,0.22)",
                  letterSpacing: "0.1em",
                }}
              >
                BEST
              </span>
            </div>
          </div>

          <Rule />

          <div>
            <p
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.62rem",
                color: "rgba(240,235,225,0.32)",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              TODAY · {played.size} / {VISIBLE_GAMES.length}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
              {GAME_META.map((game) => {
                const done = played.has(game.id);
                const result = results[game.id];
                return (
                  <div
                    key={game.id}
                    style={{
                      backgroundColor: game.bg,
                      padding: "9px 10px 8px",
                      opacity: done ? 1 : 0.38,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: "0.58rem",
                          color: game.fg,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {game.short}
                      </span>
                      {done && <Check size={8} color={game.fg} strokeWidth={3} />}
                    </div>
                    <span
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: "0.6rem",
                        color: done ? game.fg : "transparent",
                        opacity: done ? 0.7 : 1,
                      }}
                    >
                      {result?.label ?? "·"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Rule />

          <div>
            <p
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.62rem",
                color: "rgba(240,235,225,0.32)",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              VERBUM · GUESS DISTRIBUTION
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {VERBUM_DISTRIBUTION.map((count, i) => (
                <DistBar
                  key={i}
                  index={i}
                  count={count}
                  max={distMax}
                  highlight={verbumWon && verbumGuessIndex === i}
                />
              ))}
            </div>
          </div>

          <Rule />

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <StatBlock value={TOTAL_PLAYED} label="PLAYED" />
            <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
            <StatBlock value={`${WIN_RATE}%`} label="WIN RATE" />
            <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
            <StatBlock value={AVG_GUESS} label="AVG GUESS" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
