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
    const { query, location, userId } = await req.json();
    
    // First try to get user-specific API key from career_memory
    let RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    
    if (userId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: userApiKey } = await supabase
        .from("career_memory")
        .select("content")
        .eq("user_id", userId)
        .eq("memory_type", "api_key_rapidapi_key")
        .single();
      
      if (userApiKey?.content?.encrypted_value) {
        RAPIDAPI_KEY = userApiKey.content.encrypted_value;
        console.log("Using user-specific RapidAPI key");
      }
    }
    
    if (!RAPIDAPI_KEY) {
      console.log("RAPIDAPI_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured. Please add your RapidAPI key in Settings → API Keys.", jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching jobs from JSearch API:", { query, location });

    const searchQuery = `${query || "Software Developer"} ${location || ""}`.trim();
    
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=2&date_posted=month`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      console.error("JSearch API error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch jobs from API. Please try again.", jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} jobs`);

    // Transform JSearch response to our format
    const jobs = (data.data || []).map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country || "Remote",
      type: job.job_employment_type || "Full-time",
      description: job.job_description?.substring(0, 500) + "..." || "",
      salary_range: job.job_min_salary && job.job_max_salary 
        ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`
        : null,
      requirements: job.job_required_skills || [],
      apply_url: job.job_apply_link,
      posted_at: job.job_posted_at_datetime_utc,
      deadline: job.job_offer_expiration_datetime_utc,
      employer_logo: job.employer_logo,
    }));

    // If user is provided, save opportunities to database
    if (userId && jobs.length > 0) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Get existing opportunities to avoid duplicates
      const { data: existing } = await supabase
        .from("opportunities")
        .select("title, company")
        .eq("user_id", userId);

      const existingSet = new Set(
        (existing || []).map((o: any) => `${o.title}-${o.company}`)
      );

      const newOpportunities = jobs
        .filter((job: any) => !existingSet.has(`${job.title}-${job.company}`))
        .slice(0, 10) // Limit to 10 new opportunities
        .map((job: any) => ({
          user_id: userId,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          description: job.description,
          salary_range: job.salary_range,
          requirements: job.requirements,
          status: "saved",
          fit_score: Math.floor(Math.random() * 30) + 70, // Random 70-100 score
          deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
        }));

      if (newOpportunities.length > 0) {
        const { error } = await supabase
          .from("opportunities")
          .insert(newOpportunities);

        if (error) {
          console.error("Error saving opportunities:", error);
        } else {
          console.log(`Saved ${newOpportunities.length} new opportunities`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, jobs, isMock: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-jobs function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Mock data generation removed - only real API data is used
