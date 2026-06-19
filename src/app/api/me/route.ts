import { createRouteHandler } from "@/lib/supabase/route-handler";

const GET = createRouteHandler({ auth: "user" }, async (_req, ctx) => {
  const { data: user, error } = await ctx.supabase.auth.getUser();

  if (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }

  return Response.json({
    authMode: ctx.authMode,
    userClaims: ctx.userClaims,
    user: user.user,
  });
});

export { GET };
