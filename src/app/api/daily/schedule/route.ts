import { buildClientSchedule } from "@/lib/daily-preview";
import { getTodayKey } from "@/lib/daily";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? getTodayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ message: "Invalid date" }, { status: 400 });
  }

  const schedule = await buildClientSchedule(date);
  return Response.json(schedule);
}
