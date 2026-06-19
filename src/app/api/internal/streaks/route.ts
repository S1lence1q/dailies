import { createRouteHandler } from "@/lib/supabase/route-handler";

/**
 * Example of a secret-key–authenticated internal endpoint.
 * Call with header: apikey: <SUPABASE_SECRET_KEY>
 * Uses supabaseAdmin to bypass RLS.
 */
const POST = createRouteHandler({ auth: "secret" }, async (req, ctx) => {
  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    streak?: number;
  };

  // Example admin write — replace with your streaks table when ready:
  // await ctx.supabaseAdmin.from("streaks").upsert({ user_id: body.userId, count: body.streak })

  return Response.json({
    authMode: ctx.authMode,
    received: body,
    note: "Wire ctx.supabaseAdmin to your streaks table",
  });
});

export { POST };
