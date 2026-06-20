/**
 * Build GloVe-based word vectors for CONTEXT (~30k+ common English words).
 *
 * One-time download of glove.6B.50d.txt (~682 MB) from Stanford NLP.
 * Outputs:
 *   src/games/content/context-vocab.json
 *   src/games/content/context-vectors.bin
 *
 * Usage: node scripts/build-context-vectors.mjs
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GLOVE_URL = "https://nlp.stanford.edu/data/glove.6B.zip";
const GLOVE_ZIP = path.join(ROOT, ".cache/glove.6B.zip");
const GLOVE_TXT = path.join(ROOT, ".cache/glove.6B.50d.txt");
const VOCAB_OUT = path.join(ROOT, "src/games/content/context-vocab.json");
const VECTORS_OUT = path.join(ROOT, "src/games/content/context-vectors.bin");
const WORDLIST_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";

const DIM = 50;
const MAGIC = 0x44505458; // DPTX
const VERSION = 1;

async function download(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`Using cached ${dest}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`Downloading ${url} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  await pipeline(res.body, createWriteStream(dest));
  console.log(`Saved ${dest}`);
}

async function extractGloveTxt() {
  if (fs.existsSync(GLOVE_TXT)) return;
  console.log("Extracting glove.6B.50d.txt from zip …");
  const { execSync } = await import("node:child_process");
  fs.mkdirSync(path.dirname(GLOVE_TXT), { recursive: true });
  execSync(`unzip -p "${GLOVE_ZIP}" glove.6B.50d.txt > "${GLOVE_TXT}"`, {
    stdio: "inherit",
    maxBuffer: 1024 * 1024 * 1024,
  });
}

async function fetchPriorityWords() {
  const res = await fetch(WORDLIST_URL);
  if (!res.ok) throw new Error("Failed to fetch google-10000 word list");
  const text = await res.text();
  return new Set(
    text
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z]{3,24}$/.test(w)),
  );
}

function isValidWord(w) {
  return /^[a-z]{3,24}$/.test(w);
}

async function parseGlove(priorityWords) {
  const entries = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(GLOVE_TXT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lines = 0;
  for await (const line of rl) {
    lines++;
    if (lines % 50000 === 0) console.log(`  …${lines} lines`);

    const space = line.indexOf(" ");
    if (space === -1) continue;
    const word = line.slice(0, space).toLowerCase();
    if (!isValidWord(word)) continue;

    const parts = line.slice(space + 1).trim().split(/\s+/);
    if (parts.length !== DIM) continue;

    const vec = new Float32Array(DIM);
    for (let i = 0; i < DIM; i++) vec[i] = parseFloat(parts[i]);
    entries.set(word, vec);
  }

  console.log(`Parsed ${entries.size} GloVe words`);

  // Priority words first, then the rest alphabetically
  const vocab = [];
  for (const w of priorityWords) {
    if (entries.has(w)) vocab.push(w);
  }
  const rest = [...entries.keys()]
    .filter((w) => !priorityWords.has(w))
    .sort();
  for (const w of rest) vocab.push(w);

  console.log(`Vocabulary: ${vocab.length} words (${priorityWords.size} priority hits)`);
  return { vocab, entries };
}

function writeOutputs(vocab, entries) {
  const count = vocab.length;
  const buffer = Buffer.alloc(16 + count * DIM * 4);
  buffer.writeUInt32LE(MAGIC, 0);
  buffer.writeUInt32LE(VERSION, 4);
  buffer.writeUInt32LE(DIM, 8);
  buffer.writeUInt32LE(count, 12);

  let offset = 16;
  for (const word of vocab) {
    const vec = entries.get(word);
    for (let i = 0; i < DIM; i++) {
      buffer.writeFloatLE(vec[i], offset);
      offset += 4;
    }
  }

  fs.writeFileSync(VOCAB_OUT, JSON.stringify(vocab));
  fs.writeFileSync(VECTORS_OUT, buffer);
  console.log(`Wrote ${VOCAB_OUT} (${count} words)`);
  console.log(`Wrote ${VECTORS_OUT} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  const priorityWords = await fetchPriorityWords();
  console.log(`Priority word list: ${priorityWords.size} words`);

  await download(GLOVE_URL, GLOVE_ZIP);
  await extractGloveTxt();

  const { vocab, entries } = await parseGlove(priorityWords);
  writeOutputs(vocab, entries);

  // Sanity checks
  for (const target of ["anchor", "boat", "ship", "ocean", "library", "book"]) {
    console.log(`  ${target}: ${entries.has(target) ? "✓" : "✗"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
