import { createRouteHandler } from "@/lib/supabase/route-handler";

const GET = createRouteHandler({ auth: "none" }, async () => {
  return Response.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

export { GET };
