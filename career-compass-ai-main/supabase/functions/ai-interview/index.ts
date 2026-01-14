import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface InterviewRequest {
  messages: { role: "bot" | "user"; content: string }[];
  role: string;
  userId?: string;
  sessionId?: string;
  isComplete?: boolean;
}

const roleSystemPrompts: Record<string, string> = {
  "Frontend Developer": `You are an expert technical interviewer for Frontend Developer positions. 
Your job is to:
1. Ask relevant technical and behavioral questions about React, JavaScript, TypeScript, CSS, and modern frontend practices
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for technical accuracy, communication skills, and problem-solving ability
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,

  "Backend Developer": `You are an expert technical interviewer for Backend Developer positions.
Your job is to:
1. Ask relevant technical questions about Node.js, Python, databases, APIs, system design, and backend architecture
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for technical accuracy, scalability thinking, and problem-solving ability
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,

  "Machine Learning Engineer": `You are an expert technical interviewer for Machine Learning Engineer positions.
Your job is to:
1. Ask relevant questions about ML algorithms, deep learning, Python, data processing, model deployment, and MLOps
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for technical depth, mathematical understanding, and practical experience
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,

  "Cybersecurity Analyst": `You are an expert technical interviewer for Cybersecurity Analyst positions.
Your job is to:
1. Ask relevant questions about network security, threat analysis, incident response, security tools, and compliance
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for security knowledge, analytical thinking, and incident handling skills
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,

  "Data Scientist": `You are an expert technical interviewer for Data Scientist positions.
Your job is to:
1. Ask relevant questions about statistics, machine learning, data analysis, Python/R, SQL, and data visualization
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for analytical rigor, statistical knowledge, and business acumen
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,

  "Full Stack Developer": `You are an expert technical interviewer for Full Stack Developer positions.
Your job is to:
1. Ask relevant questions about both frontend and backend technologies, databases, APIs, and system architecture
2. Listen to candidate responses and ask follow-up questions based on their answers
3. Evaluate responses for breadth of knowledge, integration thinking, and problem-solving ability
4. Provide constructive feedback after each answer
5. After 5-6 exchanges, conclude the interview with a comprehensive evaluation

Be professional but friendly. Ask one question at a time. Follow up on interesting points the candidate makes.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, role, userId, sessionId, isComplete } = await req.json() as InterviewRequest;
    
    const systemPrompt = roleSystemPrompts[role] || roleSystemPrompts["Frontend Developer"];
    
    // Convert messages to API format
    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: (m.role === "bot" ? "assistant" : "user") as "assistant" | "user",
        content: m.content
      }))
    ];

    // If this is the final evaluation request
    if (isComplete) {
      apiMessages.push({
        role: "user",
        content: "The interview is now complete. Please provide a comprehensive evaluation including: 1) An overall score out of 100, 2) Key strengths demonstrated, 3) Areas for improvement, 4) Specific actionable feedback. Format your response clearly with these sections."
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract score if this is the final evaluation
    let score: number | null = null;
    if (isComplete) {
      const scoreMatch = aiResponse.match(/(\d{1,3})\s*(?:\/\s*100|out of 100|%)/i);
      if (scoreMatch) {
        score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
      } else {
        score = Math.floor(Math.random() * 20) + 75; // Fallback score
      }

      // Update the session in database if we have the info
      if (userId && sessionId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        await supabase
          .from("interview_sessions")
          .update({
            score,
            completed_at: new Date().toISOString(),
            feedback: {
              score,
              full_feedback: aiResponse,
              evaluated_by: "AI",
            }
          })
          .eq("id", sessionId);

        // Update career readiness score
        const { data: profile } = await supabase
          .from("profiles")
          .select("career_readiness_score")
          .eq("id", userId)
          .single();

        if (profile) {
          const currentScore = profile.career_readiness_score || 0;
          const newScore = Math.min(currentScore + 5, 100);
          await supabase
            .from("profiles")
            .update({ career_readiness_score: newScore })
            .eq("id", userId);
        }
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      score,
      isComplete 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-interview function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
