import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  DAILY_OVERRIDES,
  type DailyOverrides,
} from "@/games/content/daily-manifest";
import { createServiceClient } from "@/lib/supabase/service";

const JSON_PATH = path.join(process.cwd(), "src/games/content/daily-overrides.json");
const CACHE_TTL_MS = 30_000;

let remoteCache: Record<string, DailyOverrides> = {};
let remoteLoadedAt = 0;
let remoteLoadError: string | null = null;

function bustContextCache(): void {
  void import("@/games/content/context-engine").then((m) => m.resetContextEngineCache());
}

function readJsonOverrides(): Record<string, DailyOverrides> {
  try {
    const raw = fs.readFileSync(JSON_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, DailyOverrides>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonOverrides(data: Record<string, DailyOverrides>): void {
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function mergeDay(date: string): DailyOverrides {
  const manifest = DAILY_OVERRIDES[date] ?? {};
  const json = readJsonOverrides()[date] ?? {};
  const remote = remoteCache[date] ?? {};
  return { ...manifest, ...json, ...remote };
}

export function getOverridesForDate(date: string): DailyOverrides {
  return mergeDay(date);
}

export async function refreshRemoteOverrides(): Promise<void> {
  if (Date.now() - remoteLoadedAt < CACHE_TTL_MS) return;

  const client = createServiceClient();
  if (!client) {
    remoteCache = {};
    remoteLoadedAt = Date.now();
    remoteLoadError = null;
    return;
  }

  const { data, error } = await client
    .from("daily_overrides")
    .select("schedule_date, overrides");

  if (error) {
    console.error("[daily-overrides] remote fetch failed:", error.message);
    remoteCache = {};
    remoteLoadedAt = Date.now();
    remoteLoadError = error.message;
    return;
  }

  const next: Record<string, DailyOverrides> = {};
  for (const row of data ?? []) {
    const date = String(row.schedule_date).slice(0, 10);
    next[date] = (row.overrides ?? {}) as DailyOverrides;
  }
  remoteCache = next;
  remoteLoadedAt = Date.now();
  remoteLoadError = null;
  bustContextCache();
}

export function getRemoteLoadError(): string | null {
  return remoteLoadError;
}

export type SaveTarget = "remote" | "local" | "none";

export function getSaveTarget(): SaveTarget {
  if (createServiceClient()) return "remote";
  if (process.env.NODE_ENV === "development") return "local";
  return "none";
}

export async function saveOverridesForDate(
  date: string,
  overrides: DailyOverrides,
): Promise<SaveTarget> {
  const target = getSaveTarget();
  if (target === "none") {
    throw new Error("No storage configured. Set SUPABASE_SERVICE_ROLE_KEY or run locally.");
  }

  const cleaned: DailyOverrides = {};
  if (overrides.verbum?.trim()) cleaned.verbum = overrides.verbum.trim().toUpperCase();
  if (overrides.context?.trim()) cleaned.context = overrides.context.trim().toLowerCase();
  if (overrides.pitch !== undefined && overrides.pitch !== null) cleaned.pitch = overrides.pitch;
  if (overrides.ratio !== undefined && overrides.ratio !== null) cleaned.ratio = overrides.ratio;

  if (target === "remote") {
    const client = createServiceClient()!;
    const { error } = await client.from("daily_overrides").upsert({
      schedule_date: date,
      overrides: cleaned,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    remoteCache[date] = cleaned;
    remoteLoadedAt = Date.now();
    bustContextCache();
    return "remote";
  }

  const all = readJsonOverrides();
  if (Object.keys(cleaned).length === 0) {
    delete all[date];
  } else {
    all[date] = cleaned;
  }
  writeJsonOverrides(all);
  bustContextCache();
  return "local";
}

export async function deleteOverridesForDate(date: string): Promise<SaveTarget> {
  const target = getSaveTarget();
  if (target === "none") {
    throw new Error("No storage configured.");
  }

  if (target === "remote") {
    const client = createServiceClient()!;
    const { error } = await client.from("daily_overrides").delete().eq("schedule_date", date);
    if (error) throw new Error(error.message);
    delete remoteCache[date];
    bustContextCache();
    return "remote";
  }

  const all = readJsonOverrides();
  delete all[date];
  writeJsonOverrides(all);
  bustContextCache();
  return "local";
}

export async function ensureOverridesLoaded(): Promise<void> {
  await refreshRemoteOverrides();
}
