"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, Play, Pause, Music } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { FONT } from "@/lib/typography";
import type { GamePlayerProps } from "@/games/types";
import { evaluatePitchGuess, type SongSuggestion } from "@/lib/itunes";
import { getTodayKey } from "@/games/content/pitch-tracks";
import { audioFX } from "@/lib/audio-fx";
import { GameCompleteActions } from "./GameCompleteActions";

// ── Tokens (from Figma PitchGame) ─────────────────────────────────────────────
const FG     = "#B5C8E2";
const ACCENT = "#4A6EA8";
const BG     = "#101928";
const DIM    = "rgba(181,200,226,0.28)";
const GREEN  = "#3D9B5C";
const ARTIST = "#B8910A";

const CLIP_START  = 0.1;
const REVEAL_SECS = [0.1, 0.5, 2, 8, 15, 15];
const MAX_ROUNDS  = 6;

type Phase       = "loading" | "active" | "done";
type GuessResult = "correct" | "artist" | "wrong" | "skipped";
type Attempt     = { text: string; skipped: boolean; result: GuessResult };

type TrackData = {
  previewUrl: string;
  artist: string;
  title: string;
  aliases: string[];
  displayArtist: string;
  displayTitle: string;
  puzzleNumber: number;
  artworkUrl?: string;
};

type SavedGame = {
  round: number;
  attempts: Attempt[];
  gameOver: boolean;
  won: boolean;
};

function migrateAttempt(raw: unknown): Attempt {
  if (!raw || typeof raw !== "object") return { text: "", skipped: false, result: "wrong" };
  const a = raw as Record<string, unknown>;
  if (a.result === "correct" || a.result === "artist" || a.result === "wrong" || a.result === "skipped") {
    return { text: String(a.text ?? ""), skipped: Boolean(a.skipped), result: a.result };
  }
  if (a.skipped) return { text: "", skipped: true, result: "skipped" };
  if (a.correct) return { text: String(a.text ?? ""), skipped: false, result: "correct" };
  return { text: String(a.text ?? ""), skipped: false, result: "wrong" };
}

function buildShareText(attempts: Attempt[], won: boolean, streak: number): string {
  const score  = won ? `${attempts.length} / ${MAX_ROUNDS}` : "X / 6";
  const blocks = attempts.map((a) =>
    a.result === "correct" ? "🟩" : a.result === "artist" ? "🟨" : a.result === "skipped" ? "⬜" : "🟥"
  ).join("");
  return `dailies — PITCH ${score}\n\n${blocks}\n\n🔥 ${streak} day streak\ndailies.xyz`;
}

function dotColor(attempt: Attempt | undefined, isCurrent: boolean): string {
  if (attempt?.result === "correct") return GREEN;
  if (attempt?.result === "artist")  return ARTIST;
  if (attempt?.skipped)              return "rgba(181,200,226,0.12)";
  if (attempt)                       return "rgba(181,200,226,0.3)";
  if (isCurrent)                     return "rgba(181,200,226,0.07)";
  return "rgba(181,200,226,0.07)";
}

const CONTENT_MAX = 560;
const PLAY_BTN = 52;

const PITCH_BARS = [
  22, 48, 35, 72, 58, 42, 85, 38, 62, 48, 78, 52, 32, 68, 44, 30, 55, 40, 65, 28,
];

function PitchWaveform({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "4px",
        height: "72px",
        width: "100%",
        justifyContent: "center",
        borderBottom: "1px solid rgba(181, 200, 226, 0.14)",
        paddingBottom: "12px",
      }}
    >
      {PITCH_BARS.map((h, i) => (
        <div
          key={i}
          style={{
            width: "5px",
            flexShrink: 0,
            height: `${h}%`,
            borderRadius: "1px",
            backgroundColor: FG,
            opacity: isPlaying ? 0.55 : 0.22,
            transition: "opacity 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

const REVEAL_LABELS = ["0.1s", "0.5s", "2s", "8s", "15s"];

function AttemptHistory({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        maxWidth: CONTENT_MAX,
      }}
    >
      {attempts.map((a, i) => {
        const isCorrect = a.result === "correct";
        const isArtist = a.result === "artist";
        const isSkipped = a.result === "skipped" || a.skipped;

        let rowColor = FG;
        let rowOpacity = 0.55;
        let decoration: string | undefined;
        let label = a.text;

        if (isCorrect) {
          rowColor = GREEN;
          rowOpacity = 1;
        } else if (isArtist) {
          rowColor = ARTIST;
          rowOpacity = 1;
        } else if (isSkipped) {
          rowOpacity = 0.4;
          label = "— skip";
        } else {
          rowOpacity = 0.5;
          decoration = "line-through";
        }

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "36px",
              padding: "0 14px",
              border: "1px solid rgba(181, 200, 226, 0.1)",
              borderRadius: "2px",
              backgroundColor: "rgba(181, 200, 226, 0.04)",
              fontFamily: FONT.sans,
              fontSize: "0.92rem",
              color: rowColor,
              opacity: rowOpacity,
            }}
          >
            <span
              style={{
                textDecoration: decoration,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.65rem",
                opacity: 0.5,
                marginLeft: "8px",
                letterSpacing: "0.06em",
              }}
            >
              {i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SegmentedProgressBar({
  playProgress,
  isPlaying,
  secs,
  canPlay,
  onPlay,
  onStop,
}: {
  playProgress: number;
  isPlaying: boolean;
  secs: number;
  canPlay: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  const durations = [0.1, 0.4, 1.5, 6.0, 7.0];
  const starts = [0, 0.1, 0.5, 2.0, 8.0];
  const activeTime = isPlaying ? (playProgress / 100) * secs : 0;

  return (
    <div style={{ width: "100%", maxWidth: CONTENT_MAX }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          type="button"
          onClick={isPlaying ? onStop : onPlay}
          disabled={!canPlay}
          style={{
            width: PLAY_BTN,
            height: PLAY_BTN,
            flexShrink: 0,
            borderRadius: "2px",
            backgroundColor: isPlaying ? ACCENT : "rgba(74,110,168,0.18)",
            border: `2px solid ${canPlay ? (isPlaying ? FG : ACCENT) : "rgba(74,110,168,0.25)"}`,
            color: isPlaying ? BG : FG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canPlay ? "pointer" : "default",
            opacity: canPlay ? 1 : 0.4,
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          }}
          aria-label={isPlaying ? "Pause clip" : "Play clip"}
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: "2px",
              height: "14px",
              width: "100%",
              backgroundColor: "rgba(181, 200, 226, 0.05)",
              border: "1px solid rgba(181, 200, 226, 0.18)",
              borderRadius: "2px",
              boxSizing: "border-box",
            }}
          >
            {durations.map((dur, i) => {
              const isUnlocked = starts[i] < secs;
              const start = starts[i];
              const end = start + dur;

              let fillPercent = 0;
              if (isPlaying) {
                if (activeTime >= end) fillPercent = 100;
                else if (activeTime > start) fillPercent = ((activeTime - start) / dur) * 100;
              }

              return (
                <div
                  key={i}
                  style={{
                    flex: dur,
                    backgroundColor: isUnlocked
                      ? "rgba(181, 200, 226, 0.08)"
                      : "rgba(181, 200, 226, 0.02)",
                    position: "relative",
                    height: "100%",
                  }}
                >
                  {isUnlocked && fillPercent > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${fillPercent}%`,
                        backgroundColor: ACCENT,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
              paddingRight: "2px",
            }}
          >
            {REVEAL_LABELS.map((label) => (
              <span
                key={label}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.62rem",
                  color: "rgba(181,200,226,0.42)",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Suggestions dropdown (Figma style with Album Art) ─────────────────────────
function Suggestions({
  items,
  hlIndex,
  onSelect,
  onHover,
}: {
  items: SongSuggestion[];
  hlIndex: number;
  onSelect: (s: SongSuggestion) => void;
  onHover: (i: number) => void;
}) {
  if (!items.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      role="listbox"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: "#0D1520",
        border: "1px solid rgba(74,110,168,0.22)",
        borderTop: "none",
        maxHeight: "220px",
        overflowY: "auto",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      }}
    >
      {items.map((s, i) => (
        <button
          key={`${s.label}-${i}`}
          type="button"
          role="option"
          aria-selected={i === hlIndex}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(s)}
          onMouseEnter={() => onHover(i)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "10px 18px",
            textAlign: "left",
            fontFamily: FONT.sans,
            fontSize: "0.92rem",
            color: FG,
            background: i === hlIndex ? "rgba(74,110,168,0.12)" : "none",
            border: "none",
            borderBottom: i < items.length - 1 ? "1px solid rgba(74,110,168,0.08)" : "none",
            cursor: "pointer",
          }}
        >
          {s.artworkUrl ? (
            <img
              src={s.artworkUrl}
              alt=""
              style={{
                width: "28px",
                height: "28px",
                objectFit: "cover",
                borderRadius: "2px",
                border: "1px solid rgba(181,200,226,0.1)",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div style={{
              width: "28px",
              height: "28px",
              backgroundColor: "rgba(181,200,226,0.05)",
              border: "1px solid rgba(181,200,226,0.1)",
              borderRadius: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Music size={11} style={{ opacity: 0.3 }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {s.title}
            </span>
            <span style={{ display: "block", fontSize: "0.74rem", color: "rgba(181,200,226,0.4)", marginTop: "1px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {s.artist}
            </span>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PitchGame({ onComplete, streak, played, onPlayNext, onBackToLineup }: GamePlayerProps) {
  const storageKey = `dailies_pitch_${getTodayKey()}`;

  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const cleanupRef    = useRef<(() => void) | null>(null);
  const rafRef        = useRef<number | null>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [track,          setTrack]          = useState<TrackData | null>(null);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [round,          setRound]          = useState(0);
  const [phase,          setPhase]          = useState<Phase>("loading");
  const [attempts,       setAttempts]       = useState<Attempt[]>([]);
  const [input,          setInput]          = useState("");
  const [won,            setWon]            = useState(false);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [hasPlayed,      setHasPlayed]      = useState(false);
  const [playProgress,   setPlayProgress]   = useState(0);
  const [suggestions,    setSuggestions]    = useState<SongSuggestion[]>([]);
  const [showSuggest,    setShowSuggest]    = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [hlIndex,        setHlIndex]        = useState(0);

  const done         = phase === "done";
  const secs         = REVEAL_SECS[Math.min(round, MAX_ROUNDS - 1)];
  const canSubmit    = Boolean(input.trim());
  const skipBonus    = round < MAX_ROUNDS - 1 ? REVEAL_SECS[round + 1] - REVEAL_SECS[round] : null;

  const stopAudio = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = CLIP_START;
    }
    setIsPlaying(false);
    setPlayProgress(0);
  }, []);

  const playClip = useCallback(async () => {
    if (!track?.previewUrl || isPlaying) return;
    stopAudio();
    audioFX.playClick();

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    const onEnded = () => stopAudio();
    audio.addEventListener("ended", onEnded);
    cleanupRef.current = () => audio.removeEventListener("ended", onEnded);

    const playTime = done ? 30 : REVEAL_SECS[Math.min(round, MAX_ROUNDS - 1)];
    const playEnd = CLIP_START + playTime;

    const tick = () => {
      if (audio.paused) return;
      const elapsed = Math.max(0, audio.currentTime - CLIP_START);
      setPlayProgress(Math.min((elapsed / playTime) * 100, 100));
      if (audio.currentTime >= playEnd) { stopAudio(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };

    try {
      audio.currentTime = CLIP_START;
      setIsPlaying(true);
      setHasPlayed(true);
      setPlayProgress(0);
      await audio.play();
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      stopAudio();
      toast("Playback blocked", { description: "Tap play again." });
    }
  }, [track, done, isPlaying, stopAudio, round]);

  const persist = useCallback(
    (s: SavedGame) => localStorage.setItem(storageKey, JSON.stringify(s)),
    [storageKey],
  );

  const loadSaved = (): SavedGame => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as { round: number; attempts: unknown[]; gameOver: boolean; won: boolean };
        return {
          round: p.round ?? 0,
          attempts: (p.attempts ?? []).map(migrateAttempt),
          gameOver: p.gameOver ?? false,
          won: p.won ?? false,
        };
      }
    } catch {}
    return { round: 0, attempts: [], gameOver: false, won: false };
  };

  useEffect(() => {
    const saved = loadSaved();
    fetch("/api/pitch/today")
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<TrackData>; })
      .then((data) => {
        setTrack(data);
        setRound(saved.round);
        setAttempts(saved.attempts);
        setWon(saved.won);
        setHasPlayed(false);
        setPhase(saved.gameOver ? "done" : "active");
      })
      .catch(() => {
        setLoadError("Couldn't load today's clip.");
        setPhase("active");
      });
  }, [storageKey]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cleanupRef.current?.();
    audioRef.current?.pause();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => { setHlIndex(0); }, [suggestions]);

  const fetchSuggestions = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setSuggestions([]); setLoadingSuggest(false); return; }
    setLoadingSuggest(true);
    timerRef.current = setTimeout(() => {
      fetch(`/api/pitch/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d: { suggestions: SongSuggestion[] }) => {
          setSuggestions(d.suggestions ?? []);
          setLoadingSuggest(false);
        })
        .catch(() => { setSuggestions([]); setLoadingSuggest(false); });
    }, 280);
  }, []);

  const advanceRound = useCallback(() => {
    setHasPlayed(false);
    setPlayProgress(0);
    setIsPlaying(false);
  }, []);

  const finishLoss = useCallback((next: Attempt[]) => {
    stopAudio();
    audioFX.playError();
    setPhase("done");
    persist({ round, attempts: next, gameOver: true, won: false });
    onComplete({
      label: "X / 6",
      sub: "Better luck tomorrow",
      cover: {
        kind: "pitch",
        blocks: next.map((a) => a.result),
        artist: track?.displayArtist ?? track?.artist,
      },
    });
  }, [onComplete, persist, round, stopAudio, track]);

  const finishWin = useCallback((next: Attempt[], r: number) => {
    stopAudio();
    audioFX.playSuccess();
    setWon(true);
    setPhase("done");
    persist({ round: r, attempts: next, gameOver: true, won: true });
    onComplete({
      label: `${r + 1} / 6`,
      sub: r <= 1 ? "Impressive" : r <= 3 ? "Nice" : "Phew",
      cover: {
        kind: "pitch",
        blocks: next.map((a) => a.result),
        artist: track?.displayArtist ?? track?.artist,
      },
    });
  }, [onComplete, persist, stopAudio, track]);

  const resolve = useCallback((text: string, result: GuessResult, skipped = false) => {
    const next = [...attempts, { text, skipped, result }];
    setAttempts(next);
    setInput("");
    setSuggestions([]);
    setHlIndex(0);
    setShowSuggest(false);
    stopAudio();

    if (result === "correct") {
      finishWin(next, round);
    } else {
      if (round >= MAX_ROUNDS - 1) {
        finishLoss(next);
      } else {
        audioFX.playError();
        const nr = round + 1;
        setRound(nr);
        advanceRound();
        persist({ round: nr, attempts: next, gameOver: false, won: false });
      }
    }
  }, [attempts, round, finishLoss, finishWin, persist, stopAudio, advanceRound]);

  const selectSuggestion = (s: SongSuggestion) => {
    audioFX.playClick();
    setInput(s.label);
    setSuggestions([]);
    setShowSuggest(false);
    setHlIndex(0);
    inputRef.current?.focus();
  };

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !track) return;
    const result = evaluatePitchGuess(input, track.artist, track.title, track.aliases);
    resolve(input.trim(), result);
  }, [canSubmit, input, track, resolve]);

  const handleSkip = useCallback(() => {
    audioFX.playClick();
    resolve("", "skipped", true);
  }, [resolve]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const has = showSuggest && suggestions.length > 0;
    if (e.key === "ArrowDown" && has) { e.preventDefault(); setHlIndex((i) => Math.min(i + 1, suggestions.length - 1)); return; }
    if (e.key === "ArrowUp"   && has) { e.preventDefault(); setHlIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      if (has && hlIndex >= 0 && hlIndex < suggestions.length) { selectSuggestion(suggestions[hlIndex]); return; }
      handleSubmit();
      return;
    }
    if (e.key === "Escape") setShowSuggest(false);
  };

  const handleShare = () => {
    audioFX.playClick();
    navigator.clipboard?.writeText(buildShareText(attempts, won, streak)).catch(() => {});
    toast("Copied to clipboard");
  };

  if (phase === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} />
        <span style={{ fontFamily: FONT.mono, fontSize: "0.68rem", letterSpacing: "0.1em", color: DIM }}>
          LOADING
        </span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Attempt progress dots */}
      {!done && (
        <div
          style={{
            padding: "16px 20px 0",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: MAX_ROUNDS }, (_, i) => {
              const a = attempts[i];
              const cur = i === attempts.length;
              return (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: dotColor(a, cur),
                    border: cur ? `1px solid ${ACCENT}` : "none",
                    transition: "background-color 0.25s",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main — top-aligned, fills width */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 20px 0",
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {!done ? (
          <div
            style={{
              width: "100%",
              maxWidth: CONTENT_MAX,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: FONT.fraunces,
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 5vw, 2.75rem)",
                  color: FG,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                {secs}s clip
              </p>
              <p
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.78rem",
                  color: FG,
                  opacity: 0.5,
                  letterSpacing: "0.08em",
                  margin: "8px 0 0",
                }}
              >
                Attempt {attempts.length + 1} of {MAX_ROUNDS}
              </p>
            </div>

            <PitchWaveform isPlaying={isPlaying} />

            <AttemptHistory attempts={attempts} />

            <SegmentedProgressBar
              playProgress={playProgress}
              isPlaying={isPlaying}
              secs={secs}
              canPlay={Boolean(track?.previewUrl)}
              onPlay={playClip}
              onStop={stopAudio}
            />

            {loadError && (
              <p style={{ fontFamily: FONT.mono, fontSize: "0.75rem", color: FG, opacity: 0.6, textAlign: "center", margin: 0 }}>
                {loadError}
              </p>
            )}
          </div>
        ) : track ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 12px",
            }}
          >
            {/* Ambient/upscaled cover art */}
            {track.artworkUrl && (
              <img
                src={track.artworkUrl.replace("100x100bb.jpg", "400x400bb.jpg")}
                alt=""
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "2px",
                  marginBottom: "20px",
                  border: "1px solid rgba(181,200,226,0.15)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              />
            )}

            <div style={{ width: "100%", maxWidth: "280px", margin: "16px 0 24px", opacity: 0.35 }}>
              <PitchWaveform isPlaying={isPlaying} />
            </div>

            <span
              style={{
                display: "block",
                fontFamily: FONT.mono,
                fontSize: "0.6rem",
                color: DIM,
                letterSpacing: "0.14em",
                marginBottom: 8,
              }}
            >
              {(track.displayArtist || track.artist).toUpperCase()}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: FONT.fraunces,
                fontSize: "clamp(1.8rem, 6vw, 2.6rem)",
                fontWeight: 700,
                fontStyle: "italic",
                color: won ? GREEN : FG,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              {track.displayTitle || track.title}
            </span>

            {/* Audio player for full listening */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 16px",
                border: "1px solid rgba(74,110,168,0.2)",
                borderRadius: "2px",
                backgroundColor: "rgba(74,110,168,0.03)",
                marginBottom: "8px",
              }}
            >
              <button
                type="button"
                onClick={playClip}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "2px",
                  backgroundColor: isPlaying ? ACCENT : "rgba(74,110,168,0.12)",
                  border: `1.5px solid ${isPlaying ? FG : ACCENT}`,
                  color: isPlaying ? BG : FG,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" style={{ marginLeft: "2px" }} />}
              </button>
              <span style={{ fontFamily: FONT.mono, fontSize: "0.68rem", color: "rgba(181,200,226,0.5)", letterSpacing: "0.04em" }}>
                {isPlaying ? "PLAYING FULL TRACK" : "LISTEN TO FULL PREVIEW (30S)"}
              </span>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Bottom: input + actions */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: CONTENT_MAX,
          margin: "0 auto",
          borderTop: done ? "none" : "1px solid rgba(74,110,168,0.12)",
        }}
      >
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}
            >
              <div ref={searchWrapRef} style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setShowSuggest(true);
                    fetchSuggestions(e.target.value);
                  }}
                  onFocus={() => { if (input.length >= 2) setShowSuggest(true); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for a song or artist..."
                  disabled={false}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggest && suggestions.length > 0}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    backgroundColor: "rgba(74,110,168,0.12)",
                    border: "1px solid rgba(74,110,168,0.35)",
                    borderRadius: 2,
                    fontFamily: FONT.sans,
                    fontSize: "1.05rem",
                    color: FG,
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "text",
                    transition: "border-color 0.2s, background-color 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "rgba(74,110,168,0.6)";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "rgba(74,110,168,0.28)";
                  }}
                />
                <AnimatePresence>
                  {showSuggest && suggestions.length > 0 && (
                    <Suggestions
                      items={suggestions}
                      hlIndex={hlIndex}
                      onSelect={selectSuggestion}
                      onHover={setHlIndex}
                    />
                  )}
                </AnimatePresence>
                {loadingSuggest && (
                  <span
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: FONT.mono,
                      fontSize: "0.55rem",
                      color: DIM,
                      letterSpacing: "0.08em",
                    }}
                  >
                    …
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  height: 52,
                  border: "1px solid rgba(74,110,168,0.35)",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={false}
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    border: "none",
                    borderRight: "1px solid rgba(74,110,168,0.3)",
                    fontFamily: FONT.mono,
                    fontSize: "0.78rem",
                    color: FG,
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    transition: "background-color 0.15s, color 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(74,110,168,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  SKIP
                  {skipBonus != null && (
                    <span style={{ opacity: 0.45, fontSize: "0.6rem" }}>+{skipBonus}s</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    flex: 2,
                    border: "none",
                    backgroundColor: canSubmit ? FG : "rgba(74,110,168,0.06)",
                    fontFamily: FONT.mono,
                    fontSize: "0.8rem",
                    color: canSubmit ? BG : "rgba(181,200,226,0.28)",
                    cursor: canSubmit ? "pointer" : "default",
                    letterSpacing: "0.1em",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  Submit →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%" }}
            >
              <GameCompleteActions
                gameId="pitch"
                played={played}
                fg={FG}
                accent={ACCENT}
                shareBg={FG}
                shareFg={BG}
                onShare={handleShare}
                onPlayNext={onPlayNext}
                onBackToLineup={onBackToLineup}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
