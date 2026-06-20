"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { FONT } from "@/lib/typography";
import { CONTEXT_HEAT, CONTEXT_PALETTE } from "@/lib/color-palettes";
import { Loader2, Lightbulb, Search, MoreHorizontal, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { audioFX } from "@/lib/audio-fx";
import type { GamePlayerProps } from "@/games/types";
import { getContextPuzzleNumber, getTodayKey } from "@/games/content/context-puzzles";
import { GameCompleteActions } from "./GameCompleteActions";

const BG = CONTEXT_PALETTE.bg;
const FG = CONTEXT_PALETTE.fg;
const ACCENT = CONTEXT_PALETTE.accent;
const SURFACE = CONTEXT_PALETTE.surface;
const BORDER = CONTEXT_PALETTE.border;
const MUTED = CONTEXT_PALETTE.muted;
const WIN = CONTEXT_HEAT.win;
const COLD = CONTEXT_HEAT.cold;
const MAX_HINTS = 3;
const STARTER_WORDS = ["space", "time", "water"];
const COLD_RANK = 2000;

type GuessRecord = {
  word: string;
  rank: number;
};

type SavedGame = {
  guesses: GuessRecord[];
  gameOver: boolean;
  won: boolean;
  gaveUp: boolean;
  revealedAnswer: string | null;
  hintWords: string[];
};

type GuessFeedback = {
  word: string;
  rank: number;
  prevBest: number | null;
};

type ConfirmAction = "hint" | "giveUp";

function similarityBarWidth(rank: number): number {
  if (rank === 1) return 100;
  if (rank >= COLD_RANK) return 0;
  const ratio = COLD_RANK / rank;
  return Math.min(96, Math.max(14, Math.round(35 * Math.pow(ratio, 0.45))));
}

function buildShareText(
  guesses: GuessRecord[],
  streak: number,
  gaveUp: boolean,
  answer: string | null,
  hintCount: number,
): string {
  const n = guesses.filter((g) => g.rank !== 1 || !gaveUp).length;
  const best = [...guesses].sort((a, b) => a.rank - b.rank).slice(0, 4);
  const path = best.map((g) => g.rank).join(" → ");
  const hintPart = hintCount > 0 ? ` · ${hintCount} hint${hintCount === 1 ? "" : "s"}` : "";
  if (gaveUp && answer) {
    return `dailies — CONTEXT #${getContextPuzzleNumber()}\nGave up · ${answer}${hintPart}\n${path}\n\n🔥 ${streak} day streak\ndailies.xyz`;
  }
  return `dailies — CONTEXT #${getContextPuzzleNumber()}\nFound in ${n} ${n === 1 ? "guess" : "guesses"}${hintPart}\n${path}\n\n🔥 ${streak} day streak\ndailies.xyz`;
}

function feedbackLabel(fb: GuessFeedback): string {
  if (fb.prevBest === null) return `rank ${fb.rank.toLocaleString()}`;
  if (fb.rank < fb.prevBest) {
    const delta = fb.prevBest - fb.rank;
    return `↑ warmer · ${fb.rank.toLocaleString()} (+${delta.toLocaleString()})`;
  }
  if (fb.rank > fb.prevBest) {
    return `↓ colder · ${fb.rank.toLocaleString()} · best ${fb.prevBest.toLocaleString()}`;
  }
  return `same rank · ${fb.rank.toLocaleString()}`;
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        backgroundColor: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "320px",
          backgroundColor: SURFACE,
          borderRadius: "14px",
          padding: "22px 20px 18px",
          border: `1px solid ${BORDER}`,
        }}
      >
        <p
          style={{
            fontFamily: FONT.spaceGrotesk,
            fontWeight: 700,
            fontSize: "1.05rem",
            color: FG,
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: FONT.sans,
            fontSize: "0.88rem",
            color: MUTED,
            margin: "0 0 20px",
            lineHeight: 1.55,
          }}
        >
          {body}
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
              background: "transparent",
              fontFamily: FONT.mono,
              fontSize: "0.65rem",
              color: MUTED,
              letterSpacing: "0.06em",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: ACCENT,
              fontFamily: FONT.mono,
              fontSize: "0.65rem",
              color: BG,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GuessRow({
  word,
  rank,
  isNew,
  variant = "list",
}: {
  word: string;
  rank: number;
  isNew?: boolean;
  variant?: "list" | "last";
}) {
  const barWidth = similarityBarWidth(rank);
  const isWin = rank === 1;
  const isCold = barWidth === 0;
  const isLast = variant === "last";
  const barColor = isWin ? WIN : ACCENT;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        position: "relative",
        height: isLast ? "50px" : "46px",
        borderRadius: "10px",
        backgroundColor: isLast ? "#1A1A1A" : SURFACE,
        overflow: "hidden",
        border: isLast ? `1px solid ${ACCENT}66` : "1px solid transparent",
        boxShadow: isLast ? `0 0 0 1px ${ACCENT}22, 0 8px 24px rgba(0,0,0,0.35)` : undefined,
      }}
    >
      {barWidth > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${barWidth}%`,
            backgroundColor: barColor,
            borderRadius: "10px",
            opacity: isLast ? 0.92 : 1,
            transition: "width 0.35s ease",
          }}
        />
      )}
      {isCold && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "10px",
            bottom: "10px",
            width: "3px",
            backgroundColor: COLD,
            borderRadius: "2px",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          padding: isLast ? "0 16px 0 34px" : "0 16px",
        }}
      >
        {isLast && (
          <Play
            size={11}
            fill={FG}
            color={FG}
            style={{ position: "absolute", left: "14px", opacity: 0.9 }}
          />
        )}
        <span
          style={{
            fontFamily: FONT.spaceGrotesk,
            fontWeight: 700,
            fontSize: isLast ? "1.08rem" : "1.05rem",
            color: FG,
            letterSpacing: "-0.02em",
            textTransform: "capitalize",
          }}
        >
          {word}
        </span>
        <span
          style={{
            fontFamily: FONT.spaceGrotesk,
            fontWeight: 700,
            fontSize: "1rem",
            color: FG,
            letterSpacing: "-0.02em",
            opacity: barWidth > 0 ? 1 : 0.85,
          }}
        >
          {rank.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: FONT.mono,
        fontSize: "0.58rem",
        color: MUTED,
        letterSpacing: "0.14em",
        margin: "0 0 8px 2px",
      }}
    >
      {children}
    </p>
  );
}

export function ContextGame({ onComplete, streak, played, onPlayNext, onBackToLineup }: GamePlayerProps) {
  const storageKey = `dailies_context_${getTodayKey()}`;
  const puzzleNumber = useMemo(() => getContextPuzzleNumber(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadSaved = (): SavedGame => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<
          SavedGame & { hints?: GuessRecord[]; hintsUsed?: unknown }
        >;
        return {
          guesses: parsed.guesses ?? [],
          gameOver: parsed.gameOver ?? false,
          won: parsed.won ?? false,
          gaveUp: parsed.gaveUp ?? false,
          revealedAnswer: parsed.revealedAnswer ?? null,
          hintWords:
            parsed.hintWords ??
            (parsed.hints ?? []).map((h) => h.word),
        };
      }
    } catch {}
    return {
      guesses: [],
      gameOver: false,
      won: false,
      gaveUp: false,
      revealedAnswer: null,
      hintWords: [],
    };
  };

  const init = useMemo(loadSaved, []); // eslint-disable-line

  const [guesses, setGuesses] = useState<GuessRecord[]>(init.guesses);
  const [gameOver, setGameOver] = useState(init.gameOver);
  const [won, setWon] = useState(init.won);
  const [gaveUp, setGaveUp] = useState(init.gaveUp);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(init.revealedAnswer);
  const [hintWords, setHintWords] = useState<string[]>(init.hintWords);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [giveUpLoading, setGiveUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<GuessFeedback | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const sortedGuesses = useMemo(
    () => [...guesses].sort((a, b) => a.rank - b.rank),
    [guesses],
  );

  const bestRank = sortedGuesses[0]?.rank ?? null;
  const hintsLeft = MAX_HINTS - hintWords.length;
  const pinnedGuess = lastAdded ? guesses.find((g) => g.word === lastAdded) : null;
  const listGuesses = useMemo(() => {
    if (!pinnedGuess || gameOver) return sortedGuesses;
    return sortedGuesses.filter((g) => g.word !== pinnedGuess.word);
  }, [sortedGuesses, pinnedGuess, gameOver]);

  const persist = useCallback(
    (state: SavedGame) => {
      localStorage.setItem(storageKey, JSON.stringify(state));
    },
    [storageKey],
  );

  const saveState = useCallback(
    (patch: Partial<SavedGame>) => {
      persist({
        guesses,
        gameOver,
        won,
        gaveUp,
        revealedAnswer,
        hintWords,
        ...patch,
      });
    },
    [persist, guesses, gameOver, won, gaveUp, revealedAnswer, hintWords],
  );

  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!gameOver) refocusInput();
  }, [gameOver, refocusInput]);

  useEffect(() => {
    if (!lastFeedback) return;
    const t = setTimeout(() => setLastFeedback(null), 3200);
    return () => clearTimeout(t);
  }, [lastFeedback]);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  const submitGuess = useCallback(
    async (
      overrideWord?: string,
      persistExtra?: Partial<SavedGame>,
    ): Promise<boolean> => {
      const raw = overrideWord ?? input.trim();
      const word = raw.toLowerCase().replace(/[^a-z]/g, "");
      if (!word || word.length < 3) {
        if (!overrideWord) {
          setError("Enter a word (3+ letters)");
          refocusInput();
        }
        return false;
      }
      if (guesses.some((g) => g.word === word)) {
        if (!overrideWord) {
          setError("Already guessed");
          refocusInput();
        }
        return false;
      }
      if (gameOver || loading) return false;

      const prevBest = bestRank;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/context/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess: word }),
        });
        const data = (await res.json()) as {
          guess?: string;
          known: boolean;
          rank: number | null;
          won: boolean;
          message?: string;
        };

        if (!res.ok) {
          if (!overrideWord) setError(data.message ?? "Something went wrong");
          return false;
        }

        if (!data.known || data.rank === null) {
          if (!overrideWord) {
            setError("Not in dictionary — try another word");
            audioFX.playError();
          }
          return false;
        }

        const resolved = data.guess ?? word;
        const nextGuesses = [...guesses, { word: resolved, rank: data.rank }];
        setGuesses(nextGuesses);
        setLastAdded(resolved);
        setLastFeedback({ word: resolved, rank: data.rank, prevBest });
        setInput("");
        audioFX.playClick();

        if (data.won) {
          setWon(true);
          setGameOver(true);
          audioFX.playSuccess();
          saveState({ guesses: nextGuesses, gameOver: true, won: true, ...persistExtra });
          onComplete({
            label: String(nextGuesses.length),
            sub:
              nextGuesses.length <= 12
                ? "Sharp"
                : nextGuesses.length <= 25
                  ? "Nice"
                  : "Got there",
            cover: { kind: "context", bestRank: 1 },
          });
        } else {
          saveState({ guesses: nextGuesses, gameOver: false, won: false, ...persistExtra });
        }
        return true;
      } catch {
        if (!overrideWord) setError("Network error — try again");
        return false;
      } finally {
        setLoading(false);
        refocusInput();
      }
    },
    [input, guesses, gameOver, loading, onComplete, saveState, refocusInput, bestRank],
  );

  const confirmHint = useCallback(async () => {
    if (gameOver || hintsLeft <= 0) return;

    setHintLoading(true);
    try {
      const res = await fetch("/api/context/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guessed: guesses.map((g) => g.word),
          hintWords,
        }),
      });
      const data = (await res.json()) as {
        word?: string;
        rank?: number;
        message?: string;
      };

      if (!res.ok || !data.word) {
        toast(data.message ?? "No hint available", { duration: 2200 });
        return;
      }

      const nextHintWords = [...hintWords, data.word];
      setHintWords(nextHintWords);

      await submitGuess(data.word, { hintWords: nextHintWords });
    } catch {
      toast("Could not load hint", { duration: 2000 });
    } finally {
      setHintLoading(false);
      setConfirmAction(null);
    }
  }, [gameOver, guesses, hintWords, hintsLeft, saveState, submitGuess]);

  const confirmGiveUp = useCallback(async () => {
    if (gameOver) return;

    setGiveUpLoading(true);
    try {
      const res = await fetch("/api/context/give-up", { method: "POST" });
      const data = (await res.json()) as { answer?: string; message?: string };

      if (!res.ok || !data.answer) {
        toast(data.message ?? "Could not reveal answer", { duration: 2200 });
        return;
      }

      const answer = data.answer;
      const hasAnswer = guesses.some((g) => g.word === answer);
      const nextGuesses = hasAnswer
        ? guesses
        : [...guesses, { word: answer, rank: 1 }];
      const userBest =
        guesses.length > 0 ? Math.min(...guesses.map((g) => g.rank)) : COLD_RANK;

      setGuesses(nextGuesses);
      setRevealedAnswer(answer);
      setGaveUp(true);
      setGameOver(true);
      setWon(false);
      setLastAdded(null);
      saveState({
        guesses: nextGuesses,
        gameOver: true,
        won: false,
        gaveUp: true,
        revealedAnswer: answer,
      });
      onComplete({
        label: "Gave up",
        sub: `${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`,
        cover: { kind: "context", bestRank: userBest },
      });
    } catch {
      toast("Network error — try again", { duration: 2000 });
    } finally {
      setGiveUpLoading(false);
      setConfirmAction(null);
      setShowMenu(false);
    }
  }, [gameOver, guesses, saveState, onComplete]);

  const share = () => {
    navigator.clipboard
      ?.writeText(buildShareText(guesses, streak, gaveUp, revealedAnswer, hintWords.length))
      .catch(() => {});
    toast("Copied to clipboard", { description: "Paste anywhere to share." });
  };

  const guessCount = gaveUp ? Math.max(0, guesses.length - 1) : guesses.length;
  const canHint = !gameOver && hintsLeft > 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: BG,
      }}
    >
      <div style={{ padding: "20px 16px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              height: "52px",
              backgroundColor: SURFACE,
              borderRadius: "12px",
              padding: "0 14px",
              gap: "10px",
              border: `1px solid ${error ? COLD : BORDER}`,
            }}
          >
            <button
              type="button"
              onClick={() => submitGuess()}
              disabled={gameOver || loading || !input.trim()}
              aria-label="Submit guess"
              style={{
                display: "flex",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: 0,
                cursor: gameOver || !input.trim() ? "default" : "pointer",
                opacity: loading ? 0.4 : 0.7,
                flexShrink: 0,
              }}
            >
              {loading ? (
                <Loader2 size={18} color={MUTED} className="animate-spin" />
              ) : (
                <Search size={18} color={MUTED} />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value.replace(/[^a-zA-Z\s]/g, ""));
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitGuess();
                }
              }}
              disabled={gameOver || loading}
              placeholder="Type a word"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: FONT.spaceGrotesk,
                fontWeight: 500,
                fontSize: "1.05rem",
                color: FG,
                letterSpacing: "-0.01em",
              }}
            />

            {canHint && (
              <button
                type="button"
                onClick={() => setConfirmAction("hint")}
                disabled={hintLoading}
                title={`Hint · ${hintsLeft} left`}
                aria-label={`Get hint, ${hintsLeft} remaining`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: hintLoading ? "default" : "pointer",
                  opacity: hintLoading ? 0.4 : 0.65,
                  flexShrink: 0,
                }}
              >
                <Lightbulb size={16} color={ACCENT} />
              </button>
            )}

            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.65rem",
                color: MUTED,
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              #{puzzleNumber}
            </span>
          </div>

          {!gameOver && (
            <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                aria-label="More options"
                style={{
                  width: "44px",
                  height: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  color: MUTED,
                }}
              >
                <MoreHorizontal size={18} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      minWidth: "168px",
                      backgroundColor: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: "10px",
                      overflow: "hidden",
                      zIndex: 20,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmAction("giveUp");
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontFamily: FONT.sans,
                        fontSize: "0.88rem",
                        color: FG,
                        cursor: "pointer",
                      }}
                    >
                      Give up & reveal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "10px",
            minHeight: "18px",
            padding: "0 2px",
          }}
        >
          {guesses.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p
                style={{
                  fontFamily: FONT.sans,
                  fontSize: "0.78rem",
                  color: MUTED,
                  margin: 0,
                }}
              >
                Lower rank = closer in meaning
              </p>
              {!gameOver && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {STARTER_WORDS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        setInput(w);
                        refocusInput();
                      }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${BORDER}`,
                        background: SURFACE,
                        fontFamily: FONT.spaceGrotesk,
                        fontSize: "0.82rem",
                        color: MUTED,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: "0.62rem", color: MUTED }}>
                {guesses.length} guesses
              </span>
              {bestRank !== null && (
                <span style={{ fontFamily: FONT.mono, fontSize: "0.62rem", color: ACCENT }}>
                  best {bestRank.toLocaleString()}
                </span>
              )}
              {!gameOver && hintsLeft > 0 && (
                <span style={{ fontFamily: FONT.mono, fontSize: "0.62rem", color: MUTED }}>
                  {hintsLeft} hint{hintsLeft === 1 ? "" : "s"}
                </span>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {lastFeedback && (
              <motion.span
                key={lastFeedback.word}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color:
                    lastFeedback.prevBest !== null && lastFeedback.rank < lastFeedback.prevBest
                      ? ACCENT
                      : MUTED,
                }}
              >
                {feedbackLabel(lastFeedback)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.62rem",
              color: COLD,
              margin: "8px 2px 0",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Last guess slot + ranked list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 16px 16px",
          display: "flex",
          flexDirection: "column",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {pinnedGuess && !gameOver && (
          <div style={{ marginBottom: "18px", flexShrink: 0 }}>
            <SectionLabel>LAST GUESS</SectionLabel>
            <GuessRow
              word={pinnedGuess.word}
              rank={pinnedGuess.rank}
              variant="last"
              isNew
            />
          </div>
        )}

        {listGuesses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {pinnedGuess && !gameOver && (
              <div
                style={{
                  borderTop: `1px solid ${BORDER}`,
                  paddingTop: "14px",
                  marginBottom: "4px",
                }}
              >
                <SectionLabel>BY RANK</SectionLabel>
              </div>
            )}
            {!pinnedGuess && guesses.length > 0 && (
              <SectionLabel>BY RANK</SectionLabel>
            )}
            {listGuesses.map((g) => (
              <GuessRow
                key={g.word}
                word={g.word}
                rank={g.rank}
                isNew={g.word === lastAdded && gameOver}
              />
            ))}
          </div>
        )}
      </div>

      {gameOver && won && (
        <div
          style={{
            padding: "18px 16px 24px",
            borderTop: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: FONT.spaceGrotesk,
              fontWeight: 700,
              fontSize: "1.15rem",
              color: WIN,
              textAlign: "center",
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
            }}
          >
            Found in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}
          </p>
          <GameCompleteActions
            gameId="context"
            played={played}
            fg={FG}
            accent={ACCENT}
            shareBg={ACCENT}
            shareFg={BG}
            onShare={share}
            onPlayNext={onPlayNext}
            onBackToLineup={onBackToLineup}
          />
        </div>
      )}

      {gameOver && gaveUp && revealedAnswer && (
        <div
          style={{
            padding: "18px 16px 24px",
            borderTop: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: FONT.spaceGrotesk,
              fontWeight: 700,
              fontSize: "1.15rem",
              color: FG,
              textAlign: "center",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
              textTransform: "capitalize",
            }}
          >
            {revealedAnswer}
          </p>
          <p
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.62rem",
              color: MUTED,
              textAlign: "center",
              margin: "0 0 14px",
            }}
          >
            The answer · after {guessCount} {guessCount === 1 ? "guess" : "guesses"}
          </p>
          <GameCompleteActions
            gameId="context"
            played={played}
            fg={FG}
            accent={ACCENT}
            shareBg={ACCENT}
            shareFg={BG}
            onShare={share}
            onPlayNext={onPlayNext}
            onBackToLineup={onBackToLineup}
          />
        </div>
      )}

      <AnimatePresence>
        {confirmAction === "hint" && (
          <ConfirmDialog
            key="hint"
            title="Use a hint?"
            body={`You'll get a closer word submitted as a guess. ${hintsLeft} hint${hintsLeft === 1 ? "" : "s"} left today.`}
            confirmLabel="Use hint"
            onConfirm={confirmHint}
            onCancel={() => setConfirmAction(null)}
            loading={hintLoading}
          />
        )}
        {confirmAction === "giveUp" && (
          <ConfirmDialog
            key="giveUp"
            title="Give up?"
            body="You'll see today's answer. This won't count as a win."
            confirmLabel="Reveal answer"
            onConfirm={confirmGiveUp}
            onCancel={() => setConfirmAction(null)}
            loading={giveUpLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
