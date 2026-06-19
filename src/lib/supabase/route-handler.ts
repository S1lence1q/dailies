import { withSupabase, type SupabaseContext, type WithSupabaseConfig } from "@supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

function authNeedsUser(config: WithSupabaseConfig): boolean {
  const modes = config.auth ?? "user";
  if (Array.isArray(modes)) {
    return modes.includes("user");
  }
  return modes === "user" || modes.startsWith("user:");
}

/** Inject Bearer token from @supabase/ssr session cookie when Authorization is absent. */
async function withSessionAuthorization(request: Request): Promise<Request> {
  if (request.headers.get("Authorization")) {
    return request;
  }

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return request;
  }

  const cookieStore = await cookies();
  const ssr = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Route handlers rely on middleware for cookie refresh.
      },
    },
  });

  const {
    data: { session },
  } = await ssr.auth.getSession();

  if (!session?.access_token) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  return new Request(request, { headers });
}

/**
 * Wraps `withSupabase` for Next.js App Router route handlers.
 * Disables CORS by default (Next.js handles it). Injects session JWT from cookies for `auth: 'user'`.
 */
export function createRouteHandler<Database = unknown>(
  config: WithSupabaseConfig,
  handler: (req: Request, ctx: SupabaseContext<Database>) => Promise<Response>,
) {
  const wrapped = withSupabase({ cors: false, ...config }, handler);

  return async (request: Request) => {
    const req = authNeedsUser(config)
      ? await withSessionAuthorization(request)
      : request;
    return wrapped(req);
  };
}
