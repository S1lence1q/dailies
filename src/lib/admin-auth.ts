import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "dailies_admin";

export function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminSecret());
}

function signAdminToken(secret: string): string {
  return createHmac("sha256", secret).update("dailies-admin-v1").digest("hex");
}

export function createAdminCookieValue(secret: string): string {
  return signAdminToken(secret);
}

export function verifyAdminCookieValue(value: string | undefined, secret: string): boolean {
  if (!value) return false;
  const expected = signAdminToken(secret);
  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminRequest(request?: Request): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;

  if (request) {
    const header = request.headers.get("cookie") ?? "";
    const match = header.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
    if (match && verifyAdminCookieValue(match[1], secret)) return true;
  }

  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  return verifyAdminCookieValue(value, secret);
}
