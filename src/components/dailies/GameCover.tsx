"use client";

import { FONT } from "@/lib/typography";
import { ArrowRight, Share2, Check } from "lucide-react";
import type { GameDefinition, GameResult } from "@/games/types";

export interface CoverProps {
  game: GameDefinition;
  played: boolean;
  result: GameResult | null;
  onPlay: () => void;
  onShare: (e: React.MouseEvent) => void;
}

function PlayedBadge({ ring, check }: { ring: string; check: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: ring }}
    >
      <Check size={9} color={check} strokeWidth={3.5} />
    </div>
  );
}

function ResultStrip({
  result,
  fg,
  onShare,
}: {
  result: GameResult;
  fg: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: "0.68rem",
          color: fg,
          opacity: 0.6,
        }}
      >
        {result.label}
        <span style={{ opacity: 0.5 }}> · {result.sub}</span>
      </span>
      <button
        onClick={onShare}
        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-150 p-0.5"
        style={{ color: fg }}
        aria-label="Share result"
      >
        <Share2 size={11} />
      </button>
    </div>
  );
}

const PITCH_BARS = [
  22, 48, 35, 72, 58, 42, 85, 38, 62, 48, 78, 52, 32, 68, 44, 30, 55, 40, 65, 28,
];

export function GameCover({ game, played, result, onPlay, onShare }: CoverProps) {
  const { id, bg, fg, accent, gridArea, name, coverLabel, coverHint, tagline } = game;
  const filter = played ? "brightness(0.88)" : undefined;
  const areaClass = id === "verbum" ? "cover-verbum" : id === "context" ? "cover-context" : undefined;

  if (id === "verbum") {
    return (
      <div
        className={`${areaClass} relative overflow-hidden cursor-pointer group`}
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-7">
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: accent,
                letterSpacing: "0.1em",
              }}
            >
              {coverLabel}
            </span>
            {played && <PlayedBadge ring={accent} check={bg} />}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3
              style={{
                fontFamily: FONT.fraunces,
                color: fg,
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 0.86,
                letterSpacing: "-0.03em",
                fontStyle: "italic",
              }}
            >
              VER-
              <br />
              BUM
            </h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {played && result ? (
              <ResultStrip result={result} fg={fg} onShare={onShare} />
            ) : (
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: "0.68rem",
                    color: "rgba(213,234,216,0.28)",
                  }}
                >
                  {coverHint}
                </span>
                <ArrowRight
                  size={13}
                  style={{ color: accent }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (id === "pitch") {
    return (
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-6">
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: accent,
                letterSpacing: "0.1em",
              }}
            >
              {coverLabel}
            </span>
            {played && <PlayedBadge ring={accent} check={bg} />}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-px mb-4" style={{ height: "32px" }}>
              {PITCH_BARS.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: "3px",
                    height: `${h}%`,
                    backgroundColor: accent,
                    opacity: played ? 0.3 : 0.7,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <h3
              style={{
                fontFamily: FONT.mono,
                color: fg,
                fontSize: "clamp(1.6rem, 2.8vw, 2.5rem)",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {name}
            </h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {played && result ? (
              <ResultStrip result={result} fg={fg} onShare={onShare} />
            ) : (
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: FONT.mono, fontSize: "0.68rem", color: accent }}>
                  {coverHint}
                </span>
                <ArrowRight
                  size={13}
                  style={{ color: accent }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (id === "ratio") {
    return (
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-6">
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: accent,
                letterSpacing: "0.1em",
              }}
            >
              {coverLabel}
            </span>
            {played && <PlayedBadge ring={fg} check={bg} />}
          </div>
          <div className="flex-1 relative">
            <span
              className="absolute select-none pointer-events-none leading-none"
              style={{
                fontFamily: FONT.fraunces,
                fontSize: "7rem",
                fontWeight: 900,
                color: "rgba(244,224,213,0.09)",
                right: "-4px",
                bottom: "0",
              }}
            >
              &gt;
            </span>
          </div>
          <div>
            <h3
              style={{
                fontFamily: FONT.fraunces,
                fontWeight: 700,
                fontStyle: "italic",
                color: fg,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {name}
            </h3>
            <div className="mt-1.5">
              {played && result ? (
                <ResultStrip result={result} fg={fg} onShare={onShare} />
              ) : (
                <p style={{ fontFamily: FONT.mono, fontSize: "0.68rem", color: accent }}>
                  {coverHint}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "context") {
    return (
      <div
        className={`${areaClass} relative overflow-hidden cursor-pointer group`}
        style={{ gridArea, backgroundColor: bg, minHeight: "156px", filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-7">
          <div className="flex items-start justify-between gap-6">
            <h3
              style={{
                fontFamily: FONT.fraunces,
                color: fg,
                fontSize: "clamp(2rem, 5vw, 4.2rem)",
                fontWeight: 700,
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                fontStyle: "italic",
                flex: 1,
              }}
            >
              {name}
            </h3>
            <div className="flex items-center gap-3 flex-shrink-0 pt-1">
              <span
                className="text-xs hidden sm:block"
                style={{ color: accent, fontFamily: FONT.mono }}
              >
                {coverLabel}
              </span>
              {played && <PlayedBadge ring={accent} check={bg} />}
            </div>
          </div>
          <div className="w-full" style={{ height: "1px", backgroundColor: `${accent}33` }} />
          {played && result ? (
            <ResultStrip result={result} fg={fg} onShare={onShare} />
          ) : (
            <p
              className="text-sm"
              style={{
                color: accent,
                fontFamily: FONT.sans,
                maxWidth: "480px",
                lineHeight: 1.6,
              }}
            >
              {tagline}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Hidden games (echo, glyph) — kept for future use
  if (id === "echo") {
    return (
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-6">
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: "rgba(26,16,8,0.45)",
                letterSpacing: "0.1em",
              }}
            >
              {coverLabel}
            </span>
            {played && <PlayedBadge ring="rgba(26,16,8,0.75)" check={bg} />}
          </div>
          <div className="flex-1 flex flex-col justify-end relative overflow-hidden">
            <span
              className="absolute select-none pointer-events-none"
              style={{
                fontFamily: FONT.fraunces,
                fontSize: "9rem",
                fontWeight: 900,
                color: "rgba(26,16,8,0.07)",
                lineHeight: 1,
                right: "-8px",
                bottom: "-8px",
              }}
            >
              6
            </span>
            <h3
              style={{
                fontFamily: FONT.sans,
                color: fg,
                fontSize: "clamp(2.4rem, 4vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: "-0.05em",
              }}
            >
              {name}
            </h3>
          </div>
          {played && result && (
            <div className="mt-2">
              <ResultStrip result={result} fg={fg} onShare={onShare} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (id === "glyph") {
    const dots = [
      0.75, 0.12, 0.75, 0.12, 0.75, 0.12, 0.75, 0.12, 0.75, 0.12, 0.75, 0.75, 0.12, 0.75, 0.12,
      0.12, 0.75, 0.75, 0.12, 0.75, 0.75, 0.12, 0.75, 0.12, 0.12,
    ];
    return (
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-6">
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.68rem",
                color: "rgba(210,210,200,0.28)",
                letterSpacing: "0.1em",
              }}
            >
              {coverLabel}
            </span>
            {played && <PlayedBadge ring="#5A5A52" check={bg} />}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="grid gap-1.5 mb-5"
              style={{ gridTemplateColumns: "repeat(5, 7px)", width: "fit-content" }}
            >
              {dots.map((op, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "7px",
                    height: "7px",
                    backgroundColor: "#7A7A70",
                    opacity: played ? op * 0.5 : op,
                  }}
                />
              ))}
            </div>
            <h3
              style={{
                fontFamily: FONT.mono,
                color: fg,
                fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "0.06em",
              }}
            >
              {name}
            </h3>
          </div>
          <div>
            {played && result ? (
              <ResultStrip result={result} fg={fg} onShare={onShare} />
            ) : (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: "0.68rem",
                  color: "rgba(210,210,200,0.28)",
                }}
              >
                NO. 119
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
