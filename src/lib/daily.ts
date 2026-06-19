const EPOCH = new Date("2024-01-01").getTime();

export function getTodayKey(): string {
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
