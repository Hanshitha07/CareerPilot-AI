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
    const { fileUrl, userId } = await req.json();
    
    if (!fileUrl || !userId) {
      return new Response(
        JSON.stringify({ error: "fileUrl and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the PDF content
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Download the file
    const pathParts = fileUrl.split("/storage/v1/object/public/resumes/");
    const filePath = pathParts.length > 1 ? pathParts[1] : fileUrl;
    
    console.log("Downloading file from path:", filePath);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download resume file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to base64 for the AI
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log("Sending resume to AI for parsing...");

    // Use Lovable AI to parse the resume
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract skills, experience, and career information from resumes.
            Return a JSON object with this exact structure:
            {
              "skills": [{"name": "skill name", "category": "technical|soft|language|tool", "proficiency": 1-100}],
              "experience_level": "entry|junior|mid|senior|lead",
              "target_roles": ["role1", "role2"],
              "summary": "brief professional summary"
            }
            Only return valid JSON, no other text.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Parse this resume and extract all skills, experience level, potential target roles, and a professional summary."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to parse resume with AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let parsedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save extracted skills to the database
    if (parsedData.skills && parsedData.skills.length > 0) {
      const skillsToInsert = parsedData.skills.map((skill: any) => ({
        user_id: userId,
        name: skill.name,
        category: skill.category || "technical",
        proficiency: skill.proficiency || 50,
        target_proficiency: 100,
        status: skill.proficiency >= 70 ? "completed" : skill.proficiency >= 30 ? "in_progress" : "not_started"
      }));

      // First delete existing skills to replace with parsed ones
      await supabase.from("skills").delete().eq("user_id", userId);
      
      const { error: insertError } = await supabase
        .from("skills")
        .insert(skillsToInsert);

      if (insertError) {
        console.error("Error inserting skills:", insertError);
      }
    }

    // Update profile with experience level and target role
    if (parsedData.experience_level || parsedData.target_roles) {
      const updateData: any = {};
      if (parsedData.experience_level) {
        updateData.experience_level = parsedData.experience_level;
      }
      if (parsedData.target_roles && parsedData.target_roles.length > 0) {
        updateData.target_role = parsedData.target_roles[0];
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    }

    // Store in career memory with full parsed data
    await supabase.from("career_memory").insert({
      user_id: userId,
      memory_type: "resume_parsed",
      content: {
        parsed_at: new Date().toISOString(),
        skills: parsedData.skills?.map((s: any) => s.name) || [],
        experience_level: parsedData.experience_level,
        target_roles: parsedData.target_roles || [],
        summary: parsedData.summary
      }
    });

    console.log("Resume parsed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData,
        skills_added: parsedData.skills?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in parse-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
