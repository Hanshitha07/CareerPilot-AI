import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userId, data } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, notification_preferences, email_notifications")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found or no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.email_notifications) {
      console.log("User has disabled email notifications");
      return new Response(
        JSON.stringify({ success: false, message: "User has disabled notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prefs = profile.notification_preferences || {};
    const resend = new Resend(RESEND_API_KEY);
    let emailContent: { subject: string; html: string } | null = null;

    if (type === "deadline_reminder" && prefs.deadline_reminders !== false) {
      const { opportunity } = data;
      emailContent = {
        subject: `⏰ Application Deadline Reminder: ${opportunity.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">Deadline Approaching!</h1>
            <p>Hi ${profile.full_name || "there"},</p>
            <p>This is a reminder that the application deadline for the following opportunity is coming up:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1f2937;">${opportunity.title}</h2>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Company:</strong> ${opportunity.company}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Deadline:</strong> ${new Date(opportunity.deadline).toLocaleDateString()}</p>
              ${opportunity.location ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Location:</strong> ${opportunity.location}</p>` : ""}
            </div>
            <p>Don't miss this opportunity! Log in to your dashboard to apply now.</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              You received this email because you have deadline reminder notifications enabled.
            </p>
          </div>
        `,
      };
    } else if (type === "opportunity_match" && prefs.opportunity_matches !== false) {
      const { opportunities } = data;
      const oppList = opportunities
        .map(
          (opp: any) => `
          <li style="margin-bottom: 15px;">
            <strong>${opp.title}</strong> at ${opp.company}
            ${opp.fit_score ? `<span style="color: #22c55e;"> (${opp.fit_score}% match)</span>` : ""}
            <br>
            <span style="color: #6b7280;">${opp.location || "Remote"} • ${opp.type || "Full-time"}</span>
          </li>
        `
        )
        .join("");

      emailContent = {
        subject: `🎯 ${opportunities.length} New Job Matches Found!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">New Opportunities For You!</h1>
            <p>Hi ${profile.full_name || "there"},</p>
            <p>We found ${opportunities.length} new job opportunities that match your profile:</p>
            <ul style="list-style: none; padding: 0;">
              ${oppList}
            </ul>
            <p>Log in to your dashboard to view details and apply!</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              You received this email because you have opportunity match notifications enabled.
            </p>
          </div>
        `,
      };
    }

    if (!emailContent) {
      return new Response(
        JSON.stringify({ success: false, message: "Notification type not enabled or unknown" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${type} email to ${profile.email}`);

    const { error: emailError } = await resend.emails.send({
      from: "Career Coach <onboarding@resend.dev>",
      to: [profile.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification
    await supabase.from("notification_log").insert({
      user_id: userId,
      notification_type: type,
      reference_id: data.opportunity?.id || null,
      metadata: { email: profile.email, subject: emailContent.subject },
    });

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
