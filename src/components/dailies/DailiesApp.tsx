"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Flame, Check, Share2, Volume2, VolumeX } from "lucide-react";
import { audioFX } from "@/lib/audio-fx";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { FONT } from "@/lib/typography";
import { GameModal } from "./GameModal";
import { GamePlayer } from "./GamePlayer";
import { GameCover } from "./GameCover";
import { StatsModal } from "./StatsModal";
import {
  VISIBLE_GAMES,
  EDITOR_NOTES,
  getGame,
  getGridAreas,
  getGridRows,
  getGridColumns,
  getMobileGridAreas,
} from "@/games/registry";
import type { GameId, GameResult } from "@/games/types";

const TODAY = new Date().toISOString().split("T")[0];
const PLAYED_KEY = `dailies_played_${TODAY}`;
const STREAK_KEY = "dailies_streak";
const VISIBLE_COUNT = VISIBLE_GAMES.length;

const DEMO_RESULTS: Record<string, GameResult> = {
  pitch: { label: "3rd try", sub: "Streak 14" },
};

function useCountdown() {
  const [display, setDisplay] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setDisplay(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return display;
}

function StreakCalendar({ streak }: { streak: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    if (daysAgo === 0) return "today";
    return daysAgo <= streak ? "played" : "missed";
  });
  return (
    <div className="flex items-center gap-1" title={`${streak}-day streak`}>
      {days.map((state, i) => (
        <div
          key={i}
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "2px",
            flexShrink: 0,
            backgroundColor:
              state === "played"
                ? "#18120E"
                : state === "today"
                  ? "transparent"
                  : "rgba(24,18,14,0.13)",
            border: state === "today" ? "1.5px solid #18120E" : "none",
          }}
        />
      ))}
    </div>
  );
}

export function DailiesApp() {
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, GameResult | null>>({});
  const [streak, setStreak] = useState(12);
  const [activeGame, setActive] = useState<GameId | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(audioFX.getMuted());
  }, []);

  const toggleMute = () => {
    const nextMuted = audioFX.toggleMute();
    setMuted(nextMuted);
    toast(nextMuted ? "Sound muted" : "Sound unmuted", {
      description: nextMuted ? "Game chimes are silenced." : "Game chimes are enabled.",
      duration: 1500,
    });
  };

  const countdown = useCountdown();
  const visiblePlayed = VISIBLE_GAMES.filter((g) => played.has(g.id)).length;
  const allPlayed = visiblePlayed === VISIBLE_COUNT;
  const note = EDITOR_NOTES[new Date().getDay()];
  const todayLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const featured = getGame("verbum")!;

  useEffect(() => {
    if (!localStorage.getItem(STREAK_KEY)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem(
        STREAK_KEY,
        JSON.stringify({
          count: 12,
          lastPlayed: yesterday.toISOString().split("T")[0],
        }),
      );
    }

    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) {
        const { count, lastPlayed } = JSON.parse(raw);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        if (lastPlayed === TODAY || lastPlayed === yStr) setStreak(count);
        else setStreak(0);
      }
    } catch {}

    try {
      const raw = localStorage.getItem(PLAYED_KEY);
      if (raw) {
        const { played: savedPlayed, results: savedResults } = JSON.parse(raw);
        setPlayed(new Set(savedPlayed));
        setResults(savedResults);
      } else {
        setPlayed(new Set(["pitch"]));
        setResults(DEMO_RESULTS);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (played.size > 0) {
      localStorage.setItem(PLAYED_KEY, JSON.stringify({ played: [...played], results }));
    }
  }, [played, results]);

  const handleComplete = useCallback((id: string, result: GameResult) => {
    setPlayed((prev) => new Set([...prev, id]));
    setResults((prev) => ({ ...prev, [id]: result }));

    try {
      const raw = localStorage.getItem(STREAK_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved || saved.lastPlayed !== TODAY) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        const newCount = saved?.lastPlayed === yStr ? saved.count + 1 : 1;
        localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastPlayed: TODAY }));
        setStreak(newCount);
      }
    } catch {}
  }, []);

  const share = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const r = results[id];
      const game = getGame(id);
      const text = `dailies — ${(game?.name ?? id).toUpperCase()}\n${r?.label ?? "Completed"} · ${r?.sub ?? ""}\n🔥 ${streak} day streak`;
      navigator.clipboard?.writeText(text).catch(() => {});
      toast("Result copied", { description: "Paste it anywhere." });
    },
    [results, streak],
  );

  const mobileAreas = getMobileGridAreas();
  const desktopAreas = getGridAreas();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
    >
      <style>{`
        @media (max-width: 640px) {
          .games-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
            grid-template-areas: ${mobileAreas} !important;
          }
          .cover-verbum { min-height: 220px !important; }
          .cover-context { min-height: 160px !important; }
          .games-grid > div { min-height: 180px; }
        }
        @media (min-width: 641px) {
          .games-grid {
            grid-template-columns: ${getGridColumns()} !important;
            grid-template-rows: ${getGridRows()} !important;
            grid-template-areas: ${desktopAreas} !important;
          }
        }
        .games-grid > div { transition: filter 0.2s ease; }
        .games-grid > div:hover { filter: brightness(1.07) !important; }
      `}</style>

      <AnimatePresence>
        {showStats && (
          <StatsModal
            key="stats"
            streak={streak}
            played={played}
            results={results}
            onClose={() => setShowStats(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame && (() => {
          const game = getGame(activeGame);
          if (!game) return null;
          return (
            <GameModal
              key={activeGame}
              name={game.name}
              number={game.number}
              genre={game.genre}
              gameId={game.id}
              bg={game.bg}
              fg={game.fg}
              accent={game.accent}
              onClose={() => setActive(null)}
            >
              <GamePlayer
                gameId={activeGame}
                streak={streak}
                onComplete={(r) => handleComplete(activeGame, r)}
              />
            </GameModal>
          );
        })()}
      </AnimatePresence>

      <header className="border-b border-border sticky top-0 z-20 bg-background">
        <div
          className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between"
          style={{ height: "52px" }}
        >
          <span
            style={{
              fontFamily: FONT.fraunces,
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "-0.04em",
              fontSize: "1.25rem",
              color: "#18120E",
            }}
          >
            dailies
          </span>
          <div className="flex items-center gap-4">
            <StreakCalendar streak={streak} />
            <span
              className="text-xs hidden sm:block"
              style={{ fontFamily: FONT.mono, color: "#8A7A68" }}
            >
              {todayLabel}
            </span>
            <AuthButton />
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-2 py-1 text-xs transition-colors duration-150"
              title={muted ? "Unmute sounds" : "Mute sounds"}
              style={{
                fontFamily: FONT.mono,
                border: "1px solid rgba(24,18,14,0.12)",
                color: "#18120E",
                background: "none",
                cursor: "pointer",
              }}
            >
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors duration-150"
              style={{
                fontFamily: FONT.mono,
                border: "1px solid rgba(24,18,14,0.12)",
                color: "#18120E",
                background: "none",
                cursor: "pointer",
              }}
            >
              <Flame size={12} style={{ color: "#C84820" }} />
              <span>{streak}</span>
            </button>
          </div>
        </div>
      </header>

      <motion.section
        className="relative w-full overflow-hidden cursor-pointer group"
        style={{ backgroundColor: featured.bg, minHeight: "clamp(380px, 52vh, 580px)" }}
        onClick={() => setActive("verbum")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col"
          style={{
            minHeight: "clamp(380px, 52vh, 580px)",
            paddingTop: "3.5rem",
            paddingBottom: "3rem",
          }}
        >
          <div className="flex items-center gap-5">
            <span
              className="text-xs tracking-widest"
              style={{ color: featured.accent, fontFamily: FONT.mono }}
            >
              TODAY&apos;S GAME
            </span>
            <span
              className="text-xs tracking-widest"
              style={{ color: "rgba(213,234,216,0.28)", fontFamily: FONT.mono }}
            >
              NO. {featured.number}
            </span>
            {played.has("verbum") && (
              <div className="flex items-center gap-1.5">
                <Check size={10} color={featured.accent} />
                <span
                  className="text-xs"
                  style={{ color: featured.accent, fontFamily: FONT.mono }}
                >
                  {results.verbum?.label ?? "PLAYED"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center py-8">
            <motion.h1
              style={{
                fontFamily: FONT.fraunces,
                color: featured.fg,
                fontSize: "clamp(5rem, 15vw, 11.5rem)",
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                fontStyle: "italic",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {featured.name}
            </motion.h1>
            <motion.p
              className="mt-5 text-sm"
              style={{ color: featured.accent, maxWidth: "320px", lineHeight: 1.65 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {featured.tagline}
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
            {played.has("verbum") ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  share("verbum", e);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-200"
                style={{
                  border: "1px solid rgba(213,234,216,0.25)",
                  color: featured.accent,
                  fontFamily: FONT.mono,
                  fontSize: "0.72rem",
                }}
              >
                <Share2 size={12} /> Share result
              </button>
            ) : (
              <button
                className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-all duration-200 group-hover:gap-4"
                style={{
                  backgroundColor: featured.fg,
                  color: featured.bg,
                  fontFamily: FONT.sans,
                }}
              >
                Play today <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        </div>
      </motion.section>

      <motion.main
        className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <div className="border-l-2 pl-4 mb-10" style={{ borderColor: "rgba(24,18,14,0.15)" }}>
          <p
            className="text-xs tracking-widest mb-1"
            style={{ fontFamily: FONT.mono, color: "#A09080" }}
          >
            EDITOR&apos;S NOTE
          </p>
          <p className="text-sm italic" style={{ color: "#6A5A48", lineHeight: 1.6 }}>
            {note}
          </p>
        </div>

        <div className="flex items-baseline justify-between mb-5">
          <h2
            style={{
              fontFamily: FONT.fraunces,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "1.4rem",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Today&apos;s Lineup
          </h2>
          <span
            className="text-xs"
            style={{ fontFamily: FONT.mono, color: "#8A7A68" }}
          >
            {visiblePlayed} / {VISIBLE_COUNT} played
          </span>
        </div>

        <div
          className="games-grid w-full"
          style={{
            display: "grid",
            gridTemplateColumns: getGridColumns(),
            gridTemplateRows: getGridRows(),
            gridTemplateAreas: desktopAreas,
            gap: "6px",
          }}
        >
          {VISIBLE_GAMES.map((game) => (
            <GameCover
              key={game.id}
              game={game}
              played={played.has(game.id)}
              result={results[game.id] ?? null}
              onPlay={() => setActive(game.id)}
              onShare={(e) => share(game.id, e)}
            />
          ))}
        </div>

        {allPlayed && (
          <motion.div
            className="mt-2 flex items-center justify-between px-6 py-5"
            style={{ backgroundColor: "#18120E", color: "#F0EBE1" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <p
                className="text-xs tracking-widest mb-1"
                style={{ fontFamily: FONT.mono, color: "rgba(240,235,225,0.4)" }}
              >
                ALL DONE FOR TODAY
              </p>
              <p className="text-sm">
                New puzzles in{" "}
                <span style={{ fontFamily: FONT.mono }}>{countdown}</span>
              </p>
            </div>
            <div
              className="flex items-center gap-2"
              style={{ fontFamily: FONT.mono, fontSize: "0.82rem" }}
            >
              <Flame size={13} style={{ color: "#C84820" }} />
              <span>{streak + 1} tomorrow</span>
            </div>
          </motion.div>
        )}
      </motion.main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: "#8A7A68" }}>
            {allPlayed ? (
              <>
                Next puzzles in{" "}
                <span style={{ fontFamily: FONT.mono }}>{countdown}</span>
              </>
            ) : (
              "New puzzles every day at midnight."
            )}
          </p>
          <span
            className="text-xs"
            style={{ fontFamily: FONT.mono, color: "#A09080" }}
          >
            dailies © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
