const EPOCH = new Date("2024-01-01").getTime();

export function getTodayKey(): string {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const q = new URLSearchParams(window.location.search).get("date");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  }
  return new Date().toISOString().split("T")[0];
}

export function getDayIndex(date = getTodayKey()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - EPOCH) / 86400000);
}

export function getPuzzleNumber(base: number, date = getTodayKey()): number {
  return getDayIndex(date) + base;
}
