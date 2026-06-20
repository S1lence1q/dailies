"use client";

import { Share2 } from "lucide-react";
import { FONT } from "@/lib/typography";
import type { GameCoverVisual, GameId, GameResult } from "@/games/types";

const VERBUM_CORRECT = "#3D9B5C";
const VERBUM_PRESENT = "#B8910A";
const VERBUM_ABSENT = "rgba(213,234,216,0.14)";

const PITCH_GREEN = "#3D9B5C";
const PITCH_ARTIST = "#B8910A";
const PITCH_WRONG = "rgba(181,200,226,0.28)";
const PITCH_SKIP = "rgba(181,200,226,0.1)";

const CONTEXT_COLD_RANK = 2000;

function contextBarWidth(rank: number): number {
  if (rank === 1) return 100;
  if (rank >= CONTEXT_COLD_RANK) return 0;
  const ratio = CONTEXT_COLD_RANK / rank;
  return Math.min(96, Math.max(14, Math.round(35 * Math.pow(ratio, 0.45))));
}

function CoverShareButton({
  fg,
  onShare,
}: {
  fg: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onShare}
      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-150 p-0.5 flex-shrink-0"
      style={{ color: fg }}
      aria-label="Share result"
    >
      <Share2 size={11} />
    </button>
  );
}

function FallbackResult({
  result,
  fg,
  onShare,
}: {
  result: GameResult;
  fg: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
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
      <CoverShareButton fg={fg} onShare={onShare} />
    </div>
  );
}

function VerbumCoverResult({
  cover,
  fg,
  onShare,
}: {
  cover: Extract<GameCoverVisual, { kind: "verbum" }>;
  fg: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  const tileBg = (state: "correct" | "present" | "absent") =>
    state === "correct" ? VERBUM_CORRECT : state === "present" ? VERBUM_PRESENT : VERBUM_ABSENT;

  return (
    <div className="flex items-end justify-between gap-2">
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {cover.rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: "3px" }}>
            {row.map((state, ci) => (
              <div
                key={ci}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "1px",
                  backgroundColor: tileBg(state),
                  border:
                    state === "absent" ? `1px solid rgba(213,234,216,0.12)` : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <CoverShareButton fg={fg} onShare={onShare} />
    </div>
  );
}

function PitchCoverResult({
  cover,
  result,
  fg,
  accent,
  onShare,
}: {
  cover: Extract<GameCoverVisual, { kind: "pitch" }>;
  result: GameResult;
  fg: string;
  accent: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  const blockColor = (kind: (typeof cover.blocks)[number]) => {
    if (kind === "correct") return PITCH_GREEN;
    if (kind === "artist") return PITCH_ARTIST;
    if (kind === "skipped") return PITCH_SKIP;
    return PITCH_WRONG;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.72rem",
              color: fg,
              opacity: 0.75,
            }}
          >
            {result.label}
          </span>
          {cover.artist && (
            <p
              style={{
                fontFamily: FONT.sans,
                fontSize: "0.72rem",
                color: fg,
                opacity: 0.45,
                margin: "2px 0 0",
                lineHeight: 1.3,
                maxWidth: "160px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cover.artist}
            </p>
          )}
        </div>
        <CoverShareButton fg={fg} onShare={onShare} />
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        {Array.from({ length: 6 }, (_, i) => {
          const block = cover.blocks[i];
          return (
            <div
              key={i}
              style={{
                width: "14px",
                height: "6px",
                borderRadius: "1px",
                backgroundColor: block ? blockColor(block) : `${accent}18`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function RatioCoverResult({
  cover,
  fg,
  onShare,
}: {
  cover: Extract<GameCoverVisual, { kind: "ratio" }>;
  fg: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
        <span
          style={{
            fontFamily: FONT.fraunces,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "1.75rem",
            color: fg,
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          {cover.correct}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.62rem",
            color: fg,
            opacity: 0.32,
          }}
        >
          /{cover.total}
        </span>
      </div>
      <CoverShareButton fg={fg} onShare={onShare} />
    </div>
  );
}

function ContextCoverResult({
  cover,
  result,
  fg,
  accent,
  onShare,
}: {
  cover: Extract<GameCoverVisual, { kind: "context" }>;
  result: GameResult;
  fg: string;
  accent: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  const barWidth = contextBarWidth(cover.bestRank);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.68rem",
            color: fg,
            opacity: 0.6,
          }}
        >
          {result.label}
          {result.sub ? (
            <span style={{ opacity: 0.5 }}> · {result.sub}</span>
          ) : null}
        </span>
        <CoverShareButton fg={fg} onShare={onShare} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            flex: 1,
            height: "5px",
            borderRadius: "3px",
            backgroundColor: `${accent}22`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barWidth}%`,
              borderRadius: "3px",
              backgroundColor: accent,
              opacity: cover.bestRank === 1 ? 1 : 0.85,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.58rem",
            color: fg,
            opacity: 0.45,
            flexShrink: 0,
          }}
        >
          #{cover.bestRank.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function ratioCoverFromLabel(label: string): Extract<GameCoverVisual, { kind: "ratio" }> | null {
  const match = label.match(/^(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return { kind: "ratio", correct: parseInt(match[1], 10), total: parseInt(match[2], 10) };
}

export function CoverResultVisual({
  gameId,
  result,
  fg,
  accent,
  onShare,
}: {
  gameId: GameId;
  result: GameResult;
  fg: string;
  accent: string;
  onShare: (e: React.MouseEvent) => void;
}) {
  const cover = result.cover ?? (gameId === "ratio" ? ratioCoverFromLabel(result.label) : null);

  if (!cover) {
    return <FallbackResult result={result} fg={fg} onShare={onShare} />;
  }

  switch (cover.kind) {
    case "verbum":
      return <VerbumCoverResult cover={cover} fg={fg} onShare={onShare} />;
    case "pitch":
      return (
        <PitchCoverResult
          cover={cover}
          result={result}
          fg={fg}
          accent={accent}
          onShare={onShare}
        />
      );
    case "ratio":
      return <RatioCoverResult cover={cover} fg={fg} onShare={onShare} />;
    case "context":
      return (
        <ContextCoverResult
          cover={cover}
          result={result}
          fg={fg}
          accent={accent}
          onShare={onShare}
        />
      );
    default:
      return <FallbackResult result={result} fg={fg} onShare={onShare} />;
  }
}
