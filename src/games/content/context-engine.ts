import fs from "node:fs";
import path from "node:path";
import { getContextPuzzleForDate } from "./context-puzzles.server";
import { getTodayKey } from "@/lib/daily";

const MAGIC = 0x44505458;
const VERSION = 1;

type VectorStore = {
  dim: number;
  vocab: string[];
  wordToIndex: Map<string, number>;
  vectors: Float32Array;
};

type DailyRankCache = {
  date: string;
  target: string;
  ranks: Map<string, number>;
  vocabularySize: number;
};

let store: VectorStore | null = null;
let dailyCache: DailyRankCache | null = null;

function contentPath(...parts: string[]): string {
  return path.join(process.cwd(), "src/games/content", ...parts);
}

function loadStore(): VectorStore {
  if (store) return store;

  const binPath = contentPath("context-vectors.bin");
  const vocabPath = contentPath("context-vocab.json");

  if (!fs.existsSync(binPath) || !fs.existsSync(vocabPath)) {
    throw new Error(
      "CONTEXT vectors missing. Run: node scripts/build-context-vectors.mjs",
    );
  }

  const buffer = fs.readFileSync(binPath);
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const dim = buffer.readUInt32LE(8);
  const count = buffer.readUInt32LE(12);

  if (magic !== MAGIC || version !== VERSION) {
    throw new Error("Invalid CONTEXT vectors file format");
  }

  const vocab = JSON.parse(fs.readFileSync(vocabPath, "utf8")) as string[];
  if (vocab.length !== count) {
    throw new Error(`Vocab/count mismatch: ${vocab.length} vs ${count}`);
  }

  const vectors = new Float32Array(
    buffer.buffer,
    buffer.byteOffset + 16,
    count * dim,
  );

  const wordToIndex = new Map<string, number>();
  vocab.forEach((word, i) => wordToIndex.set(word, i));

  store = { dim, vocab, wordToIndex, vectors };
  return store;
}

function cosineSimilarity(
  vectors: Float32Array,
  dim: number,
  indexA: number,
  indexB: number,
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const offA = indexA * dim;
  const offB = indexB * dim;

  for (let d = 0; d < dim; d++) {
    const a = vectors[offA + d];
    const b = vectors[offB + d];
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildDailyRanks(date: string, target: string): DailyRankCache {
  const { dim, vocab, wordToIndex, vectors } = loadStore();
  const targetIndex = wordToIndex.get(target);

  if (targetIndex === undefined) {
    throw new Error(`Today's CONTEXT target "${target}" is not in the vocabulary`);
  }

  const scored: Array<{ word: string; sim: number }> = [];

  for (let i = 0; i < vocab.length; i++) {
    scored.push({
      word: vocab[i],
      sim: cosineSimilarity(vectors, dim, i, targetIndex),
    });
  }

  scored.sort((a, b) => b.sim - a.sim);

  const ranks = new Map<string, number>();
  scored.forEach((entry, idx) => {
    ranks.set(entry.word, idx + 1);
  });

  return {
    date,
    target,
    ranks,
    vocabularySize: vocab.length,
  };
}

function getDailyRanks(): DailyRankCache {
  const date = getTodayKey();
  const target = getContextPuzzleForDate(date).target;

  if (dailyCache?.date === date && dailyCache.target === target) {
    return dailyCache;
  }

  dailyCache = buildDailyRanks(date, target);
  return dailyCache;
}

export function normalizeContextGuess(raw: string): string | null {
  const word = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (word.length < 2 || word.length > 24) return null;
  return word;
}

/** Try base word + simple plural/singular variants */
function guessVariants(word: string): string[] {
  const variants = new Set<string>([word]);
  if (word.endsWith("s") && word.length > 3) variants.add(word.slice(0, -1));
  if (word.endsWith("es") && word.length > 4) variants.add(word.slice(0, -2));
  if (word.endsWith("ies") && word.length > 4) variants.add(`${word.slice(0, -3)}y`);
  if (!word.endsWith("s")) variants.add(`${word}s`);
  return [...variants];
}

export function lookupContextRank(guess: string): {
  rank: number | null;
  resolvedWord: string | null;
  vocabularySize: number;
} {
  const { ranks, vocabularySize } = getDailyRanks();

  for (const variant of guessVariants(guess)) {
    const rank = ranks.get(variant);
    if (rank !== undefined) {
      return { rank, resolvedWord: variant, vocabularySize };
    }
  }

  return { rank: null, resolvedWord: null, vocabularySize };
}

export function getTodayContextTarget(): string {
  return getContextPuzzleForDate().target;
}

export function getContextVocabularySize(): number {
  return getDailyRanks().vocabularySize;
}

export function getContextWordHint(
  guessedWords: string[],
  priorHintWords: string[],
): { word: string; rank: number } | null {
  const { ranks } = getDailyRanks();
  const exclude = new Set(
    [...guessedWords, ...priorHintWords].map((w) => w.toLowerCase()),
  );

  let ceiling = Infinity;
  if (priorHintWords.length > 0) {
    const last = priorHintWords[priorHintWords.length - 1].toLowerCase();
    const lastRank = ranks.get(last);
    if (lastRank !== undefined) ceiling = lastRank - 1;
  } else if (guessedWords.length > 0) {
    for (const w of guessedWords) {
      const r = ranks.get(w.toLowerCase());
      if (r !== undefined && r < ceiling) ceiling = r - 1;
    }
  } else {
    ceiling = 2000;
  }

  if (ceiling < 2) return null;

  const ideal =
    guessedWords.length === 0 && priorHintWords.length === 0
      ? 900
      : Math.max(2, Math.floor(ceiling * 0.45));

  let pick: { word: string; rank: number } | null = null;
  for (const [word, rank] of ranks) {
    if (rank === 1 || exclude.has(word) || rank > ceiling) continue;
    if (!pick || Math.abs(rank - ideal) < Math.abs(pick.rank - ideal)) {
      pick = { word, rank };
    }
  }
  return pick;
}

/** @internal testing */
export function resetContextEngineCache(): void {
  dailyCache = null;
}
