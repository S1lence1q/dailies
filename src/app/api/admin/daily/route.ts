import { isAdminRequest } from "@/lib/admin-auth";
import { buildDayRange } from "@/lib/daily-preview";
import {
  deleteOverridesForDate,
  getRemoteLoadError,
  getSaveTarget,
  saveOverridesForDate,
} from "@/lib/daily-overrides-store.server";
import type { DailyOverrides } from "@/games/content/daily-manifest";
import { getTodayKey } from "@/lib/daily";

async function requireAdmin() {
  if (!(await isAdminRequest())) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? getTodayKey();
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get("days") ?? 14)));

  try {
    const days_preview = await buildDayRange(from, days);
    const remoteError = getRemoteLoadError();
    return Response.json({
      saveTarget: getSaveTarget(),
      remoteError,
      days: days_preview,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load schedule";
    return Response.json({ message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { date?: string; overrides?: DailyOverrides };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return Response.json({ message: "Invalid date" }, { status: 400 });
  }

  try {
    const saveTarget = await saveOverridesForDate(body.date, body.overrides ?? {});
    const days = await buildDayRange(body.date, 1);
    return Response.json({ ok: true, saveTarget, day: days[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return Response.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ message: "Invalid date" }, { status: 400 });
  }

  try {
    const saveTarget = await deleteOverridesForDate(date);
    return Response.json({ ok: true, saveTarget });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return Response.json({ message }, { status: 500 });
  }
}
