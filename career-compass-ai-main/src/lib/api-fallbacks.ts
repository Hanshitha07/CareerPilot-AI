import { supabase } from "@/integrations/supabase/client";
import { mockState } from "@/lib/mock-state";

export interface MockJob {
    id: string;
    title: string;
    company: string;
    location: string;
    fit_score: number;
    type: string;
    status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
    description: string;
    created_at: string;
    salary_range: string;
}

const STORAGE_KEY_JOBS = 'career_pilot_mock_jobs';
const STORAGE_KEY_INTERVIEW = 'career_pilot_mock_interview';

const rolePools: Record<string, string[]> = {
    frontend: ["Frontend Developer", "React Engineer", "UI Engineer", "Web Developer"],
    backend: ["Backend Developer", "Node.js Engineer", "System Architect", "API Developer"],
    fullstack: ["Full Stack Engineer", "Software Engineer", "Product Engineer"],
    design: ["UI/UX Designer", "Product Designer", "Interaction Designer"],
    data: ["Data Scientist", "ML Engineer", "Data Analyst", "AI Researcher"],
};

const companyPool = ["TechFlow", "Nova Solutions", "CloudScale", "BrightFuture", "DataNexus", "WebScale", "Innovate AI", "Designify"];
const locationPool = ["Remote", "San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Berlin, DE"];

export const generateMockJobs = (skills: string[], targetRole: string | null, userId: string = 'default') => {
    return mockState.getJobs(userId);
};

export const getMockInterviewResponse = (messages: any[], role: string): string => {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

    if (lastMessage.includes("hello") || lastMessage.includes("hi")) {
        return `Great! Let's start the interview for the ${role} position. Can you tell me about a challenging project you've worked on recently?`;
    }

    if (lastMessage.includes("project") || lastMessage.includes("worked on")) {
        return `That's interesting. What was your specific role in that project, and what technologies did you use?`;
    }

    if (messages.length > 6) {
        return `Thank you for those insights. That concludes our mock interview for today. I've analyzed your responses and will provide detailed feedback in your dashboard shortly. Great job!`;
    }

    return `I see. How would you handle a situation where you have a tight deadline and a critical bug is discovered?`;
};

export async function invokeWithFallback(functionName: string, options: any) {
    try {
        const response = await supabase.functions.invoke(functionName, options);

        // If successful and has data, return it
        if (!response.error && response.data) {
            // For fetch-jobs, if empty result, trigger fallback
            if (functionName === 'fetch-jobs' && (!response.data.jobs || response.data.jobs.length === 0)) {
                throw new Error("Empty job results");
            }
            return response;
        }

        throw response.error || new Error("API failed");
    } catch (error) {
        console.warn(`Fallback triggered for ${functionName}:`, error);

        if (functionName === 'fetch-jobs') {
            const { userId } = options.body;
            const mockJobs = mockState.getJobs(userId || 'default');
            return { data: { success: true, jobs: mockJobs, isMock: true }, error: null };
        }

        if (functionName === 'ai-interview') {
            const { messages, role } = options.body;
            const mockResponse = getMockInterviewResponse(messages, role);
            return { data: { response: mockResponse, isMock: true }, error: null };
        }

        if (functionName === 'parse-resume') {
            return {
                data: {
                    success: true,
                    skills_added: 5,
                    isMock: true,
                    content: {
                        skills: ["React", "TypeScript", "Node.js", "Tailwind CSS", "UI/UX Design"],
                        experience_years: 2,
                        target_roles: ["Frontend Developer", "Full Stack Developer"]
                    }
                },
                error: null
            };
        }

        return { data: null, error };
    }
}
