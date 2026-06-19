import { createRouteHandler } from "@/lib/supabase/route-handler";

/**
 * Example of a publishable-key–authenticated endpoint.
 * Call with header: apikey: <SUPABASE_PUBLISHABLE_KEY>
 */
const GET = createRouteHandler({ auth: "publishable" }, async (_req, ctx) => {
  return Response.json({
    authMode: ctx.authMode,
    authKeyName: ctx.authKeyName,
    message: "Authenticated with publishable key",
    // RLS-scoped anonymous client — query your public tables here:
    // const { data } = await ctx.supabase.from("games").select()
  });
});

export { GET };
