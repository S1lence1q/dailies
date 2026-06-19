"use client";

import { FONT } from "@/lib/typography";
import { useState, useCallback, useMemo } from "react";
import { Share2, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { audioFX } from "@/lib/audio-fx";
import type { GamePlayerProps } from "@/games/types";
import { getRatioPuzzleForDate, getTodayKey } from "@/games/content/ratio-puzzles";

const FG = "#F4E0D5";
const ACCENT = "#F0987A";
const CORRECT = "#3D9B5C";
const WRONG = "#8B2020";

type SavedGame = {
  round: number;
  correct: number;
  gameOver: boolean;
  won: boolean;
  guesses: Array<"higher" | "lower">;
};

function buildShareText(correct: number, total: number, streak: number): string {
  const blocks = "🟩".repeat(correct) + (correct < total ? "🟥" : "");
  return `dailies — RATIO ${correct}/${total}\n\n${blocks}\n\n🔥 ${streak} day streak\ndailies.xyz`;
}

export function RatioGame({ onComplete, streak }: GamePlayerProps) {
  const puzzle = useMemo(() => getRatioPuzzleForDate(), []);
  const totalRounds = puzzle.items.length - 1;
  const storageKey = `dailies_ratio_${getTodayKey()}`;

  const loadSaved = (): SavedGame => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as SavedGame;
    } catch {}
    return { round: 0, correct: 0, gameOver: false, won: false, guesses: [] };
  };

  const init = useMemo(loadSaved, []); // eslint-disable-line

  const [round, setRound] = useState(init.round);
  const [correct, setCorrect] = useState(init.correct);
  const [gameOver, setGameOver] = useState(init.gameOver);
  const [won, setWon] = useState(init.won);
  const [guesses, setGuesses] = useState(init.guesses);
  const [revealing, setRevealing] = useState(false);
  const [lastGuess, setLastGuess] = useState<"higher" | "lower" | null>(null);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);

  const current = puzzle.items[round];
  const next = puzzle.items[round + 1];

  const persist = useCallback(
    (state: SavedGame) => {
      localStorage.setItem(storageKey, JSON.stringify(state));
    },
    [storageKey],
  );

  const finishGame = useCallback(
    (finalCorrect: number, didWin: boolean) => {
      setGameOver(true);
      setWon(didWin);
      const label = didWin ? `${finalCorrect} / ${totalRounds}` : `${finalCorrect} / ${totalRounds}`;
      const sub = didWin
        ? finalCorrect === totalRounds
          ? "Perfect run"
          : "Nice streak"
        : "One wrong — close";
      onComplete({ label, sub });
    },
    [onComplete, totalRounds],
  );

  const handleGuess = useCallback(
    (guess: "higher" | "lower") => {
      if (gameOver || revealing || !next) return;

      setRevealing(true);
      setLastGuess(guess);
      audioFX.playClick();

      const isHigher = next.value > current.value;
      const isCorrect =
        (guess === "higher" && isHigher) || (guess === "lower" && !isHigher);

      setTimeout(() => {
        setShowResult(isCorrect ? "correct" : "wrong");
        if (isCorrect) {
          audioFX.playSuccess();
        } else {
          audioFX.playError();
        }

        setTimeout(() => {
          const newGuesses = [...guesses, guess];
          setShowResult(null);
          setRevealing(false);
          setLastGuess(null);

          if (!isCorrect) {
            const state: SavedGame = {
              round,
              correct,
              gameOver: true,
              won: false,
              guesses: newGuesses,
            };
            setGuesses(newGuesses);
            persist(state);
            finishGame(correct, false);
            return;
          }

          const newCorrect = correct + 1;
          const newRound = round + 1;
          const completed = newRound >= totalRounds;

          if (completed) {
            const state: SavedGame = {
              round: newRound,
              correct: newCorrect,
              gameOver: true,
              won: true,
              guesses: newGuesses,
            };
            setRound(newRound);
            setCorrect(newCorrect);
            setGuesses(newGuesses);
            persist(state);
            finishGame(newCorrect, true);
            return;
          }

          const state: SavedGame = {
            round: newRound,
            correct: newCorrect,
            gameOver: false,
            won: false,
            guesses: newGuesses,
          };
          setRound(newRound);
          setCorrect(newCorrect);
          setGuesses(newGuesses);
          persist(state);
        }, 700);
      }, 400);
    },
    [gameOver, revealing, next, current, guesses, round, correct, persist, finishGame, totalRounds],
  );

  const share = () => {
    navigator.clipboard?.writeText(buildShareText(correct, totalRounds, streak)).catch(() => {});
    toast("Copied to clipboard", { description: "Paste anywhere to share." });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "20px 20px 24px",
        overflow: "hidden",
        gap: "16px",
      }}
    >
      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {Array.from({ length: totalRounds }, (_, i) => (
            <div
              key={i}
              style={{
                width: "20px",
                height: "3px",
                borderRadius: "1px",
                backgroundColor:
                  i < correct
                    ? CORRECT
                    : i === correct && !gameOver
                      ? ACCENT
                      : "rgba(244,224,213,0.15)",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.62rem",
            color: "rgba(244,224,213,0.35)",
            letterSpacing: "0.08em",
          }}
        >
          {correct}/{totalRounds}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
        {/* Reference card — value shown */}
        <div
          style={{
            padding: "20px 22px",
            backgroundColor: "rgba(244,224,213,0.08)",
            border: `1px solid rgba(244,224,213,0.12)`,
          }}
        >
          <p
            style={{
              fontFamily: FONT.sans,
              fontSize: "0.95rem",
              color: FG,
              lineHeight: 1.45,
              marginBottom: "10px",
            }}
          >
            {current.label}
          </p>
          <p
            style={{
              fontFamily: FONT.fraunces,
              fontSize: "2.4rem",
              fontWeight: 900,
              fontStyle: "italic",
              color: ACCENT,
              lineHeight: 1,
            }}
          >
            {current.display}
          </p>
        </div>

        {/* VS */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.62rem",
              color: "rgba(244,224,213,0.25)",
              letterSpacing: "0.2em",
            }}
          >
            VS
          </span>
        </div>

        {/* Challenge card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={next?.label ?? "done"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              padding: "20px 22px",
              backgroundColor:
                showResult === "correct"
                  ? "rgba(61,155,92,0.15)"
                  : showResult === "wrong"
                    ? "rgba(139,32,32,0.2)"
                    : "rgba(244,224,213,0.04)",
              border: `1px solid ${
                showResult === "correct"
                  ? CORRECT
                  : showResult === "wrong"
                    ? WRONG
                    : "rgba(244,224,213,0.12)"
              }`,
              transition: "background-color 0.3s, border-color 0.3s",
            }}
          >
            {next ? (
              <>
                <p
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: "0.95rem",
                    color: FG,
                    lineHeight: 1.45,
                    marginBottom: "10px",
                  }}
                >
                  {next.label}
                </p>
                <p
                  style={{
                    fontFamily: FONT.fraunces,
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    fontStyle: "italic",
                    color: revealing || gameOver ? ACCENT : "rgba(244,224,213,0.2)",
                    lineHeight: 1,
                    transition: "color 0.3s",
                  }}
                >
                  {revealing || gameOver ? next.display : "?"}
                </p>
              </>
            ) : (
              <p style={{ fontFamily: FONT.mono, fontSize: "0.75rem", color: FG, opacity: 0.5 }}>
                Done for today
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls / result */}
      {gameOver ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <p
            style={{
              fontFamily: FONT.fraunces,
              fontStyle: "italic",
              fontSize: "1.2rem",
              color: won ? CORRECT : FG,
            }}
          >
            {won ? "Perfect run!" : `${correct} correct — one wrong`}
          </p>
          <button
            onClick={share}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              backgroundColor: FG,
              color: "#B84028",
              border: "none",
              borderRadius: "2px",
              fontFamily: FONT.mono,
              fontSize: "0.72rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            <Share2 size={12} />
            Share result
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleGuess("higher")}
            disabled={revealing}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px 0",
              backgroundColor: revealing ? "rgba(240,152,122,0.2)" : ACCENT,
              border: "none",
              borderRadius: "2px",
              fontFamily: FONT.mono,
              fontSize: "0.78rem",
              color: "#B84028",
              fontWeight: 600,
              cursor: revealing ? "wait" : "pointer",
              letterSpacing: "0.08em",
              opacity: revealing && lastGuess !== "higher" ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <ChevronUp size={16} />
            HIGHER
          </button>
          <button
            onClick={() => handleGuess("lower")}
            disabled={revealing}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px 0",
              backgroundColor: revealing ? "rgba(240,152,122,0.2)" : "rgba(244,224,213,0.12)",
              border: `1px solid ${ACCENT}`,
              borderRadius: "2px",
              fontFamily: FONT.mono,
              fontSize: "0.78rem",
              color: FG,
              fontWeight: 600,
              cursor: revealing ? "wait" : "pointer",
              letterSpacing: "0.08em",
              opacity: revealing && lastGuess !== "lower" ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <ChevronDown size={16} />
            LOWER
          </button>
        </div>
      )}
    </div>
  );
}
