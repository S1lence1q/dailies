"use client";

import { FONT } from "@/lib/typography";
import { ArrowRight, Check } from "lucide-react";
import type { GameDefinition, GameResult } from "@/games/types";
import { getCoverHint, getCoverLabel } from "@/games/registry";
import { CoverResultVisual } from "./CoverResult";

export interface CoverProps {
  game: GameDefinition;
  played: boolean;
  isNext?: boolean;
  hasProgress?: boolean;
  result: GameResult | null;
  onPlay: () => void;
  onShare: (e: React.MouseEvent) => void;
}

function coverFilter(played: boolean, isNext: boolean, hasProgress: boolean): string | undefined {
  if (played) return "brightness(0.88)";
  if (isNext || !hasProgress) return undefined;
  return "brightness(0.92)";
}

function CoverTopLabel({ fg, children }: { fg: string; children: string }) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: "0.68rem",
        color: fg,
        opacity: 0.32,
        letterSpacing: "0.1em",
      }}
    >
      {children}
    </span>
  );
}

function CoverBottomHint({ fg, children }: { fg: string; children: string }) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: "0.68rem",
        color: fg,
        opacity: 0.32,
      }}
    >
      {children}
    </span>
  );
}

function CoverHeader({
  fg,
  label,
  played,
  badgeRing,
  badgeCheck,
}: {
  fg: string;
  label: string;
  played: boolean;
  badgeRing: string;
  badgeCheck: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <CoverTopLabel fg={fg}>{label}</CoverTopLabel>
      {played && <PlayedBadge ring={badgeRing} check={badgeCheck} />}
    </div>
  );
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

function CoverPlayedResult({
  gameId,
  result,
  fg,
  accent,
  onShare,
}: {
  gameId: GameDefinition["id"];
  result: GameResult;
  fg: string;
  accent: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  return (
    <CoverResultVisual
      gameId={gameId}
      result={result}
      fg={fg}
      accent={accent}
      onShare={onShare}
    />
  );
}

const PITCH_BARS = [
  22, 48, 35, 72, 58, 42, 85, 38, 62, 48, 78, 52, 32, 68, 44, 30, 55, 40, 65, 28,
];

export function GameCover({
  game,
  played,
  isNext = false,
  hasProgress = false,
  result,
  onPlay,
  onShare,
}: CoverProps) {
  const { id, bg, fg, accent, gridArea, name } = game;
  const coverLabel = getCoverLabel(game);
  const coverHint = getCoverHint(game);
  const filter = coverFilter(played, isNext, hasProgress);
  const areaClass = id === "verbum" ? "cover-verbum" : id === "context" ? "cover-context" : undefined;
  const pitchBarOpacity = played ? 0.3 : 0.7;

  if (id === "verbum") {
    return (
      <div
        className={`${areaClass} relative overflow-hidden cursor-pointer group`}
        style={{ gridArea, backgroundColor: bg, filter }}
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex flex-col p-5 md:p-7">
          <CoverHeader
            fg={fg}
            label={coverLabel}
            played={played}
            badgeRing={accent}
            badgeCheck={bg}
          />
          <div className="flex-1 flex flex-col justify-center">
            <h3
              className="cover-verbum-title"
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
              <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
            ) : (
              <div className="flex items-center justify-between">
                <CoverBottomHint fg={fg}>{coverHint ?? ""}</CoverBottomHint>
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
          <CoverHeader
            fg={fg}
            label={coverLabel}
            played={played}
            badgeRing={accent}
            badgeCheck={bg}
          />
          <div className="flex-1 flex flex-col justify-center">
            <div
              className={`cover-pitch-bars flex items-end gap-px mb-4${played ? "" : " cover-pitch-bars--live"}`}
              style={{ height: "32px" }}
            >
              {PITCH_BARS.map((h, i) => (
                <div
                  key={i}
                  className="cover-pitch-bar"
                  style={{
                    width: "3px",
                    height: `${h}%`,
                    backgroundColor: accent,
                    opacity: pitchBarOpacity,
                    flexShrink: 0,
                    transition: "opacity 0.2s ease",
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
              <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
            ) : (
              <div className="flex items-center justify-between">
                <CoverBottomHint fg={fg}>{coverHint ?? ""}</CoverBottomHint>
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
          <CoverHeader
            fg={fg}
            label={coverLabel}
            played={played}
            badgeRing={fg}
            badgeCheck={bg}
          />
          <div className="flex-1 relative">
            <span
              className="cover-ratio-gt absolute select-none pointer-events-none leading-none"
              style={{
                fontFamily: FONT.fraunces,
                fontSize: "7rem",
                fontWeight: 900,
                color: "rgba(244,224,213,0.09)",
                right: "-4px",
                bottom: "0",
                transition: "color 0.2s ease",
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
                <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
              ) : (
                <CoverBottomHint fg={fg}>{coverHint ?? ""}</CoverBottomHint>
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
        <div className="absolute inset-0 flex flex-col p-5 md:p-6">
          <CoverHeader
            fg={fg}
            label={coverLabel}
            played={played}
            badgeRing={accent}
            badgeCheck={bg}
          />
          <div className="flex-1 relative">
            <div
              className="absolute select-none pointer-events-none"
              style={{
                right: "0",
                bottom: "0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                width: "42%",
                maxWidth: "200px",
                opacity: played ? 0.12 : 0.22,
              }}
            >
              {[72, 48, 28].map((w) => (
                <div
                  key={w}
                  style={{
                    height: "6px",
                    width: `${w}%`,
                    borderRadius: "3px",
                    backgroundColor: accent,
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="cover-context-title-wrap inline-block">
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
              <span
                className="cover-context-line"
                style={{ backgroundColor: accent }}
              />
            </div>
            <div className="mt-1.5">
              {played && result ? (
                <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
              ) : (
                <div className="flex items-center justify-between">
                  <CoverBottomHint fg={fg}>{coverHint ?? ""}</CoverBottomHint>
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
              <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
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
              <CoverPlayedResult gameId={id} result={result} fg={fg} accent={accent} onShare={onShare} />
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
