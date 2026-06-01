import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const update = await req.json();
    const msg = update?.message;

    if (!msg || !msg.from) {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const from = msg.from;

    await supabase.from("subscribers").upsert(
      {
        telegram_id: from.id,
        username: from.username ?? "",
        first_name: from.first_name ?? "",
        last_name: from.last_name ?? "",
        is_active: true,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "telegram_id" }
    );

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
