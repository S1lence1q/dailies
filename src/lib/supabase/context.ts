import { resolveEnv } from "@supabase/server/core";
import {
  createAdminClient,
  createContextClient,
  verifyCredentials,
} from "@supabase/server/core";
import type { AuthModeWithKey, SupabaseContext } from "@supabase/server";
import { createSsrClient } from "./ssr";

/**
 * Composed Supabase context for Server Components.
 * Uses @supabase/ssr for cookies + @supabase/server/core for JWT verification.
 */
export async function createSupabaseContext(
  options: { auth?: AuthModeWithKey | AuthModeWithKey[] } = { auth: "user" },
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  const { data: env, error: envError } = resolveEnv();

  if (envError || !env?.url) {
    return {
      data: null,
      error: new Error(envError?.message ?? "Missing Supabase environment variables"),
    };
  }

  const ssrClient = await createSsrClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  const token = session?.access_token ?? null;

  const { data: auth, error } = await verifyCredentials(
    { token, apikey: null },
    { auth: options.auth ?? "user", env },
  );

  if (error) {
    return { data: null, error };
  }

  const supabase = createContextClient({
    auth: { token: auth!.token },
    env,
  });
  const supabaseAdmin = createAdminClient({ env });

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims: auth!.userClaims,
      jwtClaims: auth!.jwtClaims,
      authMode: auth!.authMode,
      ...(auth!.keyName ? { authKeyName: auth!.keyName } : {}),
    },
    error: null,
  };
}
