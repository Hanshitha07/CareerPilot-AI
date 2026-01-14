import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function should be called periodically (e.g., daily via cron)
// or manually triggered to check for upcoming deadlines

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find opportunities with deadlines in the next 48 hours
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    console.log("Checking for deadlines between", now.toISOString(), "and", in48Hours.toISOString());

    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("id, user_id, title, company, location, deadline, status")
      .gte("deadline", now.toISOString())
      .lte("deadline", in48Hours.toISOString())
      .in("status", ["saved", "applied", "interviewing"]);

    if (oppError) {
      console.error("Error fetching opportunities:", oppError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch opportunities" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${opportunities?.length || 0} opportunities with upcoming deadlines`);

    if (!opportunities || opportunities.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No upcoming deadlines", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which notifications have already been sent
    const { data: sentNotifications } = await supabase
      .from("notification_log")
      .select("reference_id")
      .eq("notification_type", "deadline_reminder")
      .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    const sentIds = new Set((sentNotifications || []).map((n: any) => n.reference_id));

    // Filter out already notified opportunities
    const toNotify = opportunities.filter((opp: any) => !sentIds.has(opp.id));

    console.log(`Sending notifications for ${toNotify.length} opportunities`);

    let sentCount = 0;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    for (const opportunity of toNotify) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: "deadline_reminder",
            userId: opportunity.user_id,
            data: { opportunity },
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          console.error("Failed to send notification for opportunity:", opportunity.id);
        }
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} deadline reminders`,
        sent: sentCount,
        total: toNotify.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-deadlines function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
