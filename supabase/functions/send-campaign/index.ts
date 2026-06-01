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

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load bot token
    const { data: settings } = await supabase
      .from("bot_settings")
      .select("bot_token")
      .maybeSingle();

    if (!settings?.bot_token) {
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load active subscribers
    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("id, telegram_id")
      .eq("is_active", true);

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No active subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update campaign status
    await supabase.from("campaigns").update({
      status: "sending",
      total_count: subscribers.length,
    }).eq("id", campaign_id);

    const botToken = settings.bot_token;
    const apiBase = `https://api.telegram.org/bot${botToken}`;
    let sent = 0;
    let failed = 0;

    const logs: any[] = [];

    for (const sub of subscribers) {
      try {
        const res = await fetch(`${apiBase}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: sub.telegram_id,
            text: campaign.message_text,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          sent++;
          logs.push({
            campaign_id,
            subscriber_id: sub.id,
            telegram_id: sub.telegram_id,
            status: "sent",
            error_message: "",
          });
        } else {
          failed++;
          logs.push({
            campaign_id,
            subscriber_id: sub.id,
            telegram_id: sub.telegram_id,
            status: "failed",
            error_message: json.description ?? "Unknown error",
          });
          // Deactivate if blocked
          if (json.error_code === 403) {
            await supabase.from("subscribers").update({ is_active: false }).eq("id", sub.id);
          }
        }
      } catch (err) {
        failed++;
        logs.push({
          campaign_id,
          subscriber_id: sub.id,
          telegram_id: sub.telegram_id,
          status: "failed",
          error_message: String(err),
        });
      }
    }

    if (logs.length > 0) {
      await supabase.from("campaign_logs").insert(logs);
    }

    await supabase.from("campaigns").update({
      status: "done",
      sent_count: sent,
      failed_count: failed,
      sent_at: new Date().toISOString(),
    }).eq("id", campaign_id);

    return new Response(JSON.stringify({ sent, failed, total: subscribers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
