"use client";

import { FONT } from "@/lib/typography";
// VerbumGame — daily 5-letter word game (Wordle-style).
//
// Template structure for all dailies games:
//   - Manage own game state (loaded/saved to localStorage)
//   - Call onComplete({ label, sub }) when game ends
//   - Physical + on-screen keyboard
//   - Share functionality (emoji grid)
//
// localStorage key: `dailies_verbum_YYYY-MM-DD`
// To build a new game: copy this file, keep the props interface + localStorage pattern,
// replace everything between "— GAME LOGIC —" and "— RENDER —".

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { audioFX } from "@/lib/audio-fx";
import { getTodayKey } from "@/lib/daily";
import { getOverridesForDate, pickByWord } from "@/lib/daily-content";
import { VERBUM_WORDS } from "@/games/content/verbum-words";
import type { GamePlayerProps } from "@/games/types";
import { GameCompleteActions } from "./GameCompleteActions";

// ── Word list ─────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// Colors (VERBUM palette — dark forest green)
const FG            = "#D5EAD8";
const CORRECT_BG    = "#3D9B5C";
const PRESENT_BG    = "#B8910A";
const ABSENT_BG     = "rgba(213,234,216,0.08)";
const FILLED_BG     = "rgba(213,234,216,0.14)";
const EMPTY_BG      = "transparent";

// ── Types ─────────────────────────────────────────────────────────────────────

type LetterState = "correct" | "present" | "absent" | "empty" | "filled";

type GuessRecord = {
  word: string;
  evaluation: LetterState[];
};

type SavedGame = {
  guesses: GuessRecord[];
  gameOver: boolean;
  won: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTargetWord(): string {
  const date = getTodayKey();
  const { verbum } = getOverridesForDate(date);
  return pickByWord(VERBUM_WORDS, date, verbum);
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const targetArr = target.split("");
  const guessArr  = guess.split("");

  // First pass: exact matches
  guessArr.forEach((l, i) => {
    if (l === targetArr[i]) {
      result[i] = "correct";
      targetArr[i] = "#";
    }
  });

  // Second pass: wrong position
  guessArr.forEach((l, i) => {
    if (result[i] !== "correct") {
      const idx = targetArr.indexOf(l);
      if (idx !== -1) {
        result[i] = "present";
        targetArr[idx] = "#";
      }
    }
  });

  return result;
}

function buildShareText(guesses: GuessRecord[], won: boolean, streak: number): string {
  const score = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const grid = guesses
    .map(g => g.evaluation.map(s =>
      s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"
    ).join(""))
    .join("\n");
  return `dailies — VERBUM ${score}\n\n${grid}\n\n🔥 ${streak} day streak\ndailies.xyz`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Tile({
  letter, state, animating, delay,
}: {
  letter: string;
  state: LetterState;
  animating?: boolean;
  delay?: number;
}) {
  const bg =
    state === "correct" ? CORRECT_BG :
    state === "present" ? PRESENT_BG :
    state === "absent"  ? ABSENT_BG  :
    state === "filled"  ? FILLED_BG  :
    EMPTY_BG;

  const border =
    state === "empty"  ? "1.5px solid rgba(213,234,216,0.18)" :
    state === "filled" ? "1.5px solid rgba(213,234,216,0.5)"  :
    "none";

  return (
    <div
      style={{
        width: "56px",
        height: "56px",
        backgroundColor: bg,
        border,
        borderRadius: "2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: animating
          ? `verbumReveal 0.28s ease ${delay ?? 0}ms backwards`
          : undefined,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: FONT.spaceGrotesk,
          fontSize: "1.45rem",
          fontWeight: 700,
          color: FG,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function Key({
  label, state, onClick, wide,
}: {
  label: string;
  state?: LetterState;
  onClick: () => void;
  wide?: boolean;
}) {
  const bg =
    state === "correct" ? CORRECT_BG :
    state === "present" ? PRESENT_BG :
    state === "absent"  ? ABSENT_BG  :
    "rgba(213,234,216,0.12)";

  return (
    <button
      onClick={onClick}
      style={{
        height: "48px",
        minWidth: wide ? "54px" : "34px",
        padding: wide ? "0 6px" : "0",
        backgroundColor: bg,
        border: "none",
        borderRadius: "2px",
        fontFamily: FONT.spaceGrotesk,
        fontSize: wide ? "0.75rem" : "0.95rem",
        fontWeight: 700,
        color: FG,
        opacity: state === "absent" ? 0.28 : 1,
        cursor: "pointer",
        transition: "background-color 0.15s ease, opacity 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: wide ? "0.04em" : "0",
      }}
    >
      {label}
    </button>
  );
}

// ── Main game component ───────────────────────────────────────────────────────

export function VerbumGame({
  onComplete,
  streak,
  played,
  onPlayNext,
  onBackToLineup,
}: GamePlayerProps) {
  // ── GAME LOGIC ─────────────────────────────────────────────────────────────

  const [target, setTarget] = useState(getTargetWord);
  const storageKey = `dailies_verbum_${getTodayKey()}`;

  useEffect(() => {
    fetch(`/api/daily/schedule?date=${getTodayKey()}`)
      .then((r) => r.json())
      .then((d: { verbum?: string }) => {
        if (d.verbum) setTarget(d.verbum.toUpperCase());
      })
      .catch(() => {});
  }, []);

  const loadSaved = (): SavedGame => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as SavedGame;
    } catch {}
    return { guesses: [], gameOver: false, won: false };
  };

  const init = useMemo(loadSaved, []); // eslint-disable-line

  const [guesses, setGuesses]       = useState<GuessRecord[]>(init.guesses);
  const [currentGuess, setCurrent]  = useState("");
  const [gameOver, setGameOver]     = useState(init.gameOver);
  const [won, setWon]               = useState(init.won);
  const [revealing, setRevealing]   = useState<GuessRecord | null>(null);
  const [shakingRow, setShaking]    = useState<number | null>(null);
  const [notification, setNote]     = useState<string | null>(null);

  const notify = useCallback((msg: string, ms = 1800) => {
    setNote(msg);
    setTimeout(() => setNote(null), ms);
  }, []);

  const shake = useCallback((row: number) => {
    setShaking(row);
    setTimeout(() => setShaking(null), 500);
  }, []);

  const addLetter = useCallback((letter: string) => {
    if (gameOver || revealing || currentGuess.length >= WORD_LENGTH) return;
    audioFX.playClick();
    setCurrent(prev => prev + letter);
  }, [gameOver, revealing, currentGuess]);

  const deleteLetter = useCallback(() => {
    if (gameOver || revealing) return;
    audioFX.playClick();
    setCurrent(prev => prev.slice(0, -1));
  }, [gameOver, revealing]);

  const submitGuess = useCallback(() => {
    if (gameOver || revealing) return;
    if (currentGuess.length < WORD_LENGTH) {
      shake(guesses.length);
      notify("Not enough letters");
      audioFX.playError();
      return;
    }

    audioFX.playClick();
    const guess      = currentGuess.toUpperCase();
    const evaluation = evaluateGuess(guess, target);
    const record: GuessRecord = { word: guess, evaluation };
    const isWon  = guess === target;
    const isLost = !isWon && guesses.length + 1 >= MAX_GUESSES;

    setCurrent("");
    setRevealing(record);

    const revealMs = WORD_LENGTH * 90 + 300;

    setTimeout(() => {
      const next = [...guesses, record];
      setGuesses(next);
      setRevealing(null);

      const saved: SavedGame = { guesses: next, gameOver: isWon || isLost, won: isWon };
      localStorage.setItem(storageKey, JSON.stringify(saved));

      if (isWon) {
        setWon(true);
        setGameOver(true);
        audioFX.playSuccess();
        const n = next.length;
        notify(n === 1 ? "Genius!" : n <= 2 ? "Brilliant!" : n <= 4 ? "Nice." : "Phew.", 3000);
        onComplete({
          label: `${n} / ${MAX_GUESSES}`,
          sub: n <= 2 ? "Impressive" : "Above average",
          cover: {
            kind: "verbum",
            rows: next.map((g) =>
              g.evaluation.filter(
                (s): s is "correct" | "present" | "absent" =>
                  s === "correct" || s === "present" || s === "absent",
              ),
            ),
          },
        });
      } else if (isLost) {
        setGameOver(true);
        audioFX.playError();
        notify(target, 4000);
        onComplete({
          label: `X / ${MAX_GUESSES}`,
          sub: "Better luck tomorrow",
          cover: {
            kind: "verbum",
            rows: next.map((g) =>
              g.evaluation.filter(
                (s): s is "correct" | "present" | "absent" =>
                  s === "correct" || s === "present" || s === "absent",
              ),
            ),
          },
        });
      } else {
        audioFX.playClick();
      }
    }, revealMs);
  }, [gameOver, revealing, currentGuess, guesses, target, shake, notify, onComplete, storageKey]);

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Enter")     submitGuess();
      else if (e.key === "Backspace") deleteLetter();
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitGuess, deleteLetter, addLetter]);

  // Derived keyboard letter states
  const letterStates = useMemo<Record<string, LetterState>>(() => {
    const states: Record<string, LetterState> = {};
    guesses.forEach(({ word, evaluation }) => {
      word.split("").forEach((letter, i) => {
        const s = evaluation[i];
        const curr = states[letter];
        if (curr === "correct") return;
        if (s === "correct" || !curr || (s === "present" && curr === "absent")) {
          states[letter] = s;
        }
      });
    });
    return states;
  }, [guesses]);

  // Build display rows
  const rows = useMemo(() => {
    return Array.from({ length: MAX_GUESSES }, (_, ri) => {
      if (ri < guesses.length) {
        return { kind: "submitted" as const, data: guesses[ri] };
      }
      if (revealing && ri === guesses.length) {
        return { kind: "revealing" as const, data: revealing };
      }
      if (ri === guesses.length && !gameOver) {
        return { kind: "current" as const, letters: currentGuess };
      }
      return { kind: "empty" as const };
    });
  }, [guesses, revealing, currentGuess, gameOver]);

  const share = () => {
    navigator.clipboard?.writeText(buildShareText(guesses, won, streak)).catch(() => {});
    toast("Copied to clipboard", { description: "Paste anywhere to share." });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes verbumReveal {
          from { transform: scaleY(0.65); opacity: 0.35; }
          to   { transform: scaleY(1);    opacity: 1;    }
        }
        @keyframes verbumShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 20px",
          overflow: "hidden",
        }}
      >
        {/* Notification */}
        <div style={{ height: "36px", display: "flex", alignItems: "center" }}>
          {notification && (
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.72rem",
                color: FG,
                backgroundColor: "rgba(213,234,216,0.12)",
                padding: "6px 14px",
                borderRadius: "2px",
                letterSpacing: "0.06em",
              }}
            >
              {notification}
            </div>
          )}
        </div>

        {/* Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {rows.map((row, ri) => (
            <div
              key={ri}
              style={{
                display: "flex",
                gap: "6px",
                animation: shakingRow === ri ? "verbumShake 0.45s ease" : undefined,
              }}
            >
              {(row.kind === "submitted" || row.kind === "revealing") ? (
                Array.from({ length: WORD_LENGTH }, (_, ci) => (
                  <Tile
                    key={ci}
                    letter={row.data.word[ci] ?? ""}
                    state={row.data.evaluation[ci] ?? "absent"}
                    animating={row.kind === "revealing"}
                    delay={ci * 90}
                  />
                ))
              ) : row.kind === "current" ? (
                Array.from({ length: WORD_LENGTH }, (_, ci) => (
                  <Tile
                    key={`${ci}-${row.letters[ci] ?? "_"}`}
                    letter={row.letters[ci] ?? ""}
                    state={row.letters[ci] ? "filled" : "empty"}
                  />
                ))
              ) : (
                Array.from({ length: WORD_LENGTH }, (_, ci) => (
                  <Tile key={ci} letter="" state="empty" />
                ))
              )}
            </div>
          ))}
        </div>

        {/* Game over */}
        {gameOver && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              maxWidth: "360px",
            }}
          >
            {!won && (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.72rem",
                  color: "rgba(213,234,216,0.4)",
                }}
              >
                The word was{" "}
                <span style={{ color: FG, letterSpacing: "0.1em" }}>{target}</span>
              </span>
            )}
            <GameCompleteActions
              gameId="verbum"
              played={played}
              fg={FG}
              accent="#6BAF84"
              shareBg="#D5EAD8"
              shareFg="#1B3426"
              onShare={share}
              onPlayNext={onPlayNext}
              onBackToLineup={onBackToLineup}
            />
          </div>
        )}

        {!gameOver && <div style={{ height: "40px" }} />}

        {/* Keyboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "center" }}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {ri === 2 && <Key label="⏎" onClick={submitGuess} wide />}
              {row.split("").map(key => (
                <Key
                  key={key}
                  label={key}
                  state={letterStates[key]}
                  onClick={() => addLetter(key)}
                />
              ))}
              {ri === 2 && <Key label="⌫" onClick={deleteLetter} wide />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
