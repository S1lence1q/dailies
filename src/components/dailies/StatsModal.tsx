"use client";

import { useState } from "react";
import { FONT } from "@/lib/typography";
import { X, Check, Flame } from "lucide-react";
import { motion } from "motion/react";

import { VISIBLE_GAMES } from "@/games/registry";
import type { GameId, GameResult } from "@/games/types";
import {
  getVerbumAvgGuess,
  getPitchAvgGuess,
  getContextAvgGuess,
  getGameWinRate,
  getWinRate,
  loadPlayerStats,
} from "@/lib/player-stats";

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
  const stats = loadPlayerStats();
  const [activeTab, setActiveTab] = useState<GameId>("verbum");

  const totalGames = stats.gamesWon + stats.gamesLost;

  // Verbum stats
  const verbumLabel = results.verbum?.label ?? "";
  const verbumGuessMatch = verbumLabel.match(/^(\d+)\s*\//);
  const verbumGuessIndex = verbumGuessMatch ? parseInt(verbumGuessMatch[1]) - 1 : null;
  const verbumWon = verbumGuessIndex !== null;
  const verbumDistMax = Math.max(...stats.verbumDistribution, 1);

  // Pitch stats
  const pitchLabel = results.pitch?.label ?? "";
  const pitchGuessMatch = pitchLabel.match(/^(\d+)\s*\//);
  const pitchGuessIndex = pitchGuessMatch ? parseInt(pitchGuessMatch[1]) - 1 : null;
  const pitchWon = pitchGuessIndex !== null;
  const pitchDistMax = Math.max(...stats.pitchDistribution, 1);

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

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
                  {stats.bestStreak}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
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

          {/* Game Selection Tabs */}
          <div
            style={{
              display: "flex",
              border: "1px solid rgba(240,235,225,0.08)",
              borderRadius: "2px",
              padding: "2px",
              backgroundColor: "rgba(240,235,225,0.02)",
            }}
          >
            {VISIBLE_GAMES.map((game) => {
              const active = activeTab === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => setActiveTab(game.id)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    backgroundColor: active ? "rgba(240,235,225,0.06)" : "transparent",
                    border: "none",
                    borderRadius: "1px",
                    cursor: "pointer",
                    fontFamily: FONT.mono,
                    fontSize: "0.58rem",
                    fontWeight: active ? 700 : 400,
                    color: active ? "#F0EBE1" : "rgba(240,235,225,0.35)",
                    letterSpacing: "0.06em",
                    transition: "all 0.15s ease",
                  }}
                >
                  {game.name}
                </button>
              );
            })}
          </div>

          {/* VERBUM Tab Content */}
          {activeTab === "verbum" && (
            <>
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
                {stats.verbumWins + stats.verbumLosses > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {stats.verbumDistribution.map((count, i) => (
                      <DistBar
                        key={i}
                        index={i}
                        count={count}
                        max={verbumDistMax}
                        highlight={verbumWon && verbumGuessIndex === i}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontFamily: FONT.mono, fontSize: "0.6rem", color: "rgba(240,235,225,0.22)", textAlign: "center", margin: "16px 0" }}>
                    No stats recorded yet.
                  </p>
                )}
              </div>

              <Rule />

              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <StatBlock value={stats.verbumWins + stats.verbumLosses} label="PLAYED" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getGameWinRate(stats.verbumWins, stats.verbumLosses)} label="WIN RATE" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getVerbumAvgGuess(stats)} label="AVG GUESS" />
              </div>
            </>
          )}

          {/* PITCH Tab Content */}
          {activeTab === "pitch" && (
            <>
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
                  PITCH · GUESS DISTRIBUTION
                </p>
                {stats.pitchWins + stats.pitchLosses > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {stats.pitchDistribution.map((count, i) => (
                      <DistBar
                        key={i}
                        index={i}
                        count={count}
                        max={pitchDistMax}
                        highlight={pitchWon && pitchGuessIndex === i}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontFamily: FONT.mono, fontSize: "0.6rem", color: "rgba(240,235,225,0.22)", textAlign: "center", margin: "16px 0" }}>
                    No stats recorded yet.
                  </p>
                )}
              </div>

              <Rule />

              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <StatBlock value={stats.pitchWins + stats.pitchLosses} label="PLAYED" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getGameWinRate(stats.pitchWins, stats.pitchLosses)} label="WIN RATE" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getPitchAvgGuess(stats)} label="AVG GUESS" />
              </div>
            </>
          )}

          {/* RATIO Tab Content */}
          {activeTab === "ratio" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <StatBlock value={stats.ratioPlays} label="PLAYED" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={stats.ratioWins} label="PERFECT RUNS" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={stats.ratioHighScore} label="HIGH SCORE" />
              </div>
            </>
          )}

          {/* CONTEXT Tab Content */}
          {activeTab === "context" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <StatBlock value={stats.contextWins + stats.contextLosses} label="PLAYED" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getGameWinRate(stats.contextWins, stats.contextLosses)} label="WIN RATE" />
                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
                <StatBlock value={getContextAvgGuess(stats)} label="AVG GUESSES" />
              </div>
            </>
          )}

          <Rule />

          {/* Combined Stats Summary */}
          <div>
            <p
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.62rem",
                color: "rgba(240,235,225,0.22)",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              OVERALL SUMMARY
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <StatBlock value={totalGames} label="TOTAL PLAYED" />
              <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(240,235,225,0.08)", flexShrink: 0 }} />
              <StatBlock value={getWinRate(stats)} label="TOTAL WIN RATE" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
