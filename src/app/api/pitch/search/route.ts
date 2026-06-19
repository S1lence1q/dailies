import { searchItunesSongs } from "@/lib/itunes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const suggestions = await searchItunesSongs(q, 8);
  return Response.json({ suggestions });
}
