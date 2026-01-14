import { addDays, format, subDays } from "date-fns";

// Types
export interface MockJob {
    id: string;
    title: string;
    company: string;
    location: string;
    fit_score: number;
    type: string;
    status: 'new' | 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
    description: string;
    created_at: string;
    applied_at?: string;
    deadline: string;
    salary_range: string;
    requirements: string[];
    feedback?: string; // Reason for rejection or interview feedback
    next_step?: string; // Next action item or stage details
}

export interface MockAnalytics {
    totalApplications: number;
    interviewRate: number;
    offerRate: number;
    responseRate: number;
    funnelData: { name: string; value: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
}

export interface MockCalendarEvent {
    id: string;
    title: string;
    date: string; // ISO string
    type: 'application' | 'interview' | 'offer';
    jobId: string;
    company: string;
}

// Constants
const STORAGE_KEY_PREFIX = 'career_pilot_mock_state_';

const INITIAL_JOBS: MockJob[] = [
    {
        id: 'job-1',
        title: 'Frontend Developer Intern',
        company: 'TechFlow',
        location: 'Bangalore, India (Remote)',
        type: 'Internship',
        fit_score: 95,
        status: 'new',
        description: 'Join our dynamic frontend team building next-gen web applications using React and TypeScript. Perfect for freshers with strong CS fundamentals.',
        created_at: subDays(new Date(), 10).toISOString(),
        deadline: addDays(new Date(), 14).toISOString(),
        salary_range: '₹15,000 - ₹25,000 / month',
        requirements: ['HTML', 'CSS', 'JavaScript', 'React', 'Git']
    },
    {
        id: 'job-2',
        title: 'Junior React Developer',
        company: 'Nova Solutions',
        location: 'Remote',
        type: 'Full-time',
        fit_score: 88,
        status: 'saved',
        description: 'We are looking for a Junior React Developer to assist in developing user-facing features. You will work closely with the UI/UX team.',
        created_at: subDays(new Date(), 15).toISOString(),
        deadline: addDays(new Date(), 10).toISOString(),
        salary_range: '₹4L - ₹6L / annum',
        requirements: ['React', 'Redux', 'Tailwind CSS', 'REST APIs']
    },
    {
        id: 'job-3',
        title: 'Web Developer Trainee',
        company: 'CloudScale',
        location: 'Hyderabad, India',
        type: 'Full-time',
        fit_score: 85,
        status: 'new',
        description: 'Start your career with CloudScale. Comprehensive training provided on modern web stack including MERN.',
        created_at: subDays(new Date(), 20).toISOString(),
        deadline: addDays(new Date(), 20).toISOString(),
        salary_range: '₹3.5L - ₹5L / annum',
        requirements: ['JavaScript', 'Basic Database Knowledge', 'Problem Solving']
    },
    {
        id: 'job-4',
        title: 'Junior UI Engineer',
        company: 'Designify',
        location: 'Remote',
        type: 'Contract',
        fit_score: 92,
        status: 'saved',
        description: 'Bridge the gap between design and engineering. Implement pixel-perfect UIs from Figma designs.',
        created_at: subDays(new Date(), 3).toISOString(),
        deadline: addDays(new Date(), 12).toISOString(),
        salary_range: '$20 - $30 / hour',
        requirements: ['CSS', 'Animation', 'React', 'Figma']
    },
    {
        id: 'job-5',
        title: 'Full Stack Developer (Entry Level)',
        company: 'Innovate AI',
        location: 'Pune, India',
        type: 'Full-time',
        fit_score: 78,
        status: 'new',
        description: 'Work on both client and server side. Great learning opportunity for ambitious freshers.',
        created_at: subDays(new Date(), 7).toISOString(),
        deadline: addDays(new Date(), 5).toISOString(),
        salary_range: '₹5L - ₹8L / annum',
        requirements: ['Node.js', 'React', 'MongoDB', 'Express']
    },
    {
        id: 'job-6',
        title: 'Frontend Engineering Intern',
        company: 'BrightFuture EdTech',
        location: 'Delhi, India',
        type: 'Internship',
        fit_score: 90,
        status: 'new',
        description: 'Help us build accessible educational tools for millions of students.',
        created_at: subDays(new Date(), 1).toISOString(),
        deadline: addDays(new Date(), 30).toISOString(),
        salary_range: '₹20,000 / month',
        requirements: ['Accessible Web Design', 'HTML', 'JavaScript']
    },
    // NEW JOBS START HERE
    {
        id: 'job-7',
        title: 'Junior DevOps Engineer',
        company: 'Cloud Infrastructure Corp',
        location: 'Bangalore, India',
        type: 'Full-time',
        fit_score: 82,
        status: 'new',
        description: 'Kickstart your career in cloud engineering. Learn AWS, Docker, and CI/CD pipelines from industry experts.',
        created_at: subDays(new Date(), 2).toISOString(),
        deadline: addDays(new Date(), 25).toISOString(),
        salary_range: '₹5L - ₹7L / annum',
        requirements: ['Linux', 'Basic Networking', 'Python', 'AWS']
    },
    {
        id: 'job-8',
        title: 'React Native Developer',
        company: 'MobileFirst Systems',
        location: 'Remote',
        type: 'Contract',
        fit_score: 89,
        status: 'new',
        description: 'We are a mobile-first agency looking for React Native developers to build cross-platform apps.',
        created_at: subDays(new Date(), 4).toISOString(),
        deadline: addDays(new Date(), 15).toISOString(),
        salary_range: '₹40,000 - ₹60,000 / month',
        requirements: ['React Native', 'JavaScript', 'iOS/Android Deployment']
    },
    {
        id: 'job-9',
        title: 'Product Design Intern',
        company: 'Visual Labs',
        location: 'Mumbai, India',
        type: 'Internship',
        fit_score: 85,
        status: 'saved',
        description: 'Work with our senior designers to create beautiful and functional user interfaces.',
        created_at: subDays(new Date(), 6).toISOString(),
        deadline: addDays(new Date(), 20).toISOString(),
        salary_range: '₹15,000 / month',
        requirements: ['Figma', 'UI/UX Principles', 'Prototyping']
    },
    {
        id: 'job-10',
        title: 'Associate Product Manager',
        company: 'NextGen Tech',
        location: 'Gurugram, India',
        type: 'Full-time',
        fit_score: 75,
        status: 'new',
        description: 'Join our product team to help define and deliver the next generation of our software products.',
        created_at: subDays(new Date(), 25).toISOString(),
        deadline: subDays(new Date(), 5).toISOString(),
        salary_range: '₹8L - ₹12L / annum',
        requirements: ['Product Thinking', 'Agile', 'Communication', 'Data Analysis']
    },
    {
        id: 'job-11',
        title: 'Backend Developer (Python)',
        company: 'DataStream Analytics',
        location: 'Chennai, India',
        type: 'Full-time',
        fit_score: 80,
        status: 'new',
        description: 'Build robust backend systems processing large datasets using Python and Django.',
        created_at: subDays(new Date(), 1).toISOString(),
        deadline: addDays(new Date(), 40).toISOString(),
        salary_range: '₹6L - ₹9L / annum',
        requirements: ['Python', 'Django', 'SQL', 'REST APIs']
    }
];

interface MockState {
    jobs: MockJob[];
    events: MockCalendarEvent[];
    analytics: MockAnalytics;
}

// Initial state skeleton - analytics will be calculated on first load
const INITIAL_STATE: MockState = {
    jobs: INITIAL_JOBS,
    events: [],
    analytics: {
        totalApplications: 0,
        interviewRate: 0,
        offerRate: 0,
        responseRate: 0,
        funnelData: [],
        statusDistribution: []
    }
};

class MockStateManager {

    private getKey(userId: string): string {
        return `${STORAGE_KEY_PREFIX}${userId}`;
    }

    private getState(userId: string): MockState {
        const key = this.getKey(userId);
        const stored = sessionStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        } else {
            // Initialize with deep copy of distinct initial jobs for this user
            const newState = JSON.parse(JSON.stringify(INITIAL_STATE));

            // Initial calculation of analytics based on the pre-filled jobs
            this.recalculateAnalyticsState(newState);

            sessionStorage.setItem(key, JSON.stringify(newState));
            return newState;
        }
    }

    private saveState(userId: string, state: MockState) {
        sessionStorage.setItem(this.getKey(userId), JSON.stringify(state));
    }

    getJobs(userId: string): MockJob[] {
        return this.getState(userId).jobs;
    }

    getJob(userId: string, id: string): MockJob | undefined {
        return this.getState(userId).jobs.find(j => j.id === id);
    }

    getAnalytics(userId: string): MockAnalytics {
        return this.getState(userId).analytics;
    }

    getEvents(userId: string): MockCalendarEvent[] {
        return this.getState(userId).events;
    }

    applyToJob(userId: string, jobId: string): MockJob | undefined {
        const state = this.getState(userId);
        const jobIndex = state.jobs.findIndex(j => j.id === jobId);

        if (jobIndex === -1) return undefined;

        const job = state.jobs[jobIndex];
        if (job.status === 'applied' || job.status === 'interviewing' || job.status === 'offered') return job;

        // Update Job Status
        job.status = 'applied';
        job.applied_at = new Date().toISOString();
        state.jobs[jobIndex] = job;

        // Add Calendar Event: Application Submitted (Today)
        state.events.push({
            id: `evt-app-${Date.now()}`,
            title: `Application: ${job.title}`,
            date: new Date().toISOString(),
            type: 'application',
            jobId: job.id,
            company: job.company
        });

        // Simulate Progression: 30% chance to schedule immediate mock interview (5-7 days later)
        const appliedCount = state.jobs.filter(j => j.status !== 'new' && j.status !== 'saved').length;

        if (appliedCount === 1 || Math.random() < 0.3) {
            const interviewDate = addDays(new Date(), 5 + Math.floor(Math.random() * 3));
            state.events.push({
                id: `evt-int-${Date.now()}`,
                title: `Mock Interview: ${job.company}`,
                date: interviewDate.toISOString(),
                type: 'interview',
                jobId: job.id,
                company: job.company
            });
        }

        // Save and recalculate
        this.recalculateAnalyticsState(state);
        this.saveState(userId, state);

        return job;
    }

    private recalculateAnalyticsState(state: MockState) {
        const jobs = state.jobs;
        const applied = jobs.filter(j => ['applied', 'interviewing', 'offered', 'rejected', 'accepted'].includes(j.status));
        const interviewing = jobs.filter(j => ['interviewing', 'offered', 'accepted'].includes(j.status));
        const offers = jobs.filter(j => ['offered', 'accepted'].includes(j.status));
        const rejected = jobs.filter(j => j.status === 'rejected');

        const totalApplications = applied.length;

        // Calculate Rates
        const interviewRate = totalApplications > 0 ? Math.round((interviewing.length / totalApplications) * 100) : 0;
        const offerRate = totalApplications > 0 ? Math.round((offers.length / totalApplications) * 100) : 0;
        const responseRate = totalApplications > 0 ? Math.round(((interviewing.length + rejected.length) / totalApplications) * 100) : 0;

        // Update Funnel
        const funnelData = [
            { name: "Applied", value: totalApplications },
            { name: "Screening", value: Math.max(0, totalApplications - rejected.length) },
            { name: "Interview", value: interviewing.length },
            { name: "Offer", value: offers.length },
        ];

        // Update Distribution
        const statusDistribution = [
            { name: "Applied", value: applied.length - interviewing.length - rejected.length, color: "#9b87f5" },
            { name: "Interview", value: interviewing.length - offers.length, color: "#F97316" },
            { name: "Offer", value: offers.length, color: "#10B981" },
            { name: "Rejected", value: rejected.length, color: "#EF4444" },
        ];

        state.analytics = {
            totalApplications,
            interviewRate,
            offerRate,
            responseRate,
            funnelData,
            statusDistribution
        };
    }

    private recalculateAnalytics(userId: string) {
        const state = this.getState(userId);
        this.recalculateAnalyticsState(state);
        this.saveState(userId, state);
    }

    // Helper to simulate status changes for demo (e.g., move to interview)
    simulateProgress(userId: string, jobId: string, newStatus: MockJob['status']) {
        const state = this.getState(userId);
        const jobIndex = state.jobs.findIndex(j => j.id === jobId);
        if (jobIndex === -1) return;

        state.jobs[jobIndex].status = newStatus;
        this.recalculateAnalyticsState(state);
        this.saveState(userId, state);
    }
}

export const mockState = new MockStateManager();
