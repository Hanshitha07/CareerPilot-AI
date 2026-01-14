import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { key, value } = await req.json();

    if (!key || !value) {
      return new Response(
        JSON.stringify({ error: "Key and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow specific keys to be updated
    const allowedKeys = ["RAPIDAPI_KEY"];
    if (!allowedKeys.includes(key)) {
      return new Response(
        JSON.stringify({ error: "Invalid key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the API key in a user-specific way in the career_memory table
    // This is a workaround since we can't update Supabase secrets from user requests
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Upsert the API key for this user
    const { error: upsertError } = await adminClient
      .from("career_memory")
      .upsert({
        user_id: user.id,
        memory_type: `api_key_${key.toLowerCase()}`,
        content: { key, encrypted_value: value, updated_at: new Date().toISOString() },
      }, {
        onConflict: "user_id,memory_type"
      });

    if (upsertError) {
      console.error("Error saving API key:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`API key ${key} saved for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "API key saved successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in save-api-key function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
