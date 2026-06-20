import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  createAdminCookieValue,
  getAdminSecret,
  isAdminConfigured,
  isAdminRequest,
} from "@/lib/admin-auth";

export async function GET() {
  return Response.json({
    configured: isAdminConfigured(),
    authenticated: await isAdminRequest(),
  });
}

export async function POST(req: Request) {
  const secret = getAdminSecret();
  if (!secret) {
    return Response.json({ message: "ADMIN_SECRET not configured" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (body.password !== secret) {
    return Response.json({ message: "Wrong password" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminCookieValue(secret), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
