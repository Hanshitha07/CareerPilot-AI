import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithFallback } from "@/lib/api-fallbacks";
import { Upload, FileText, ChevronRight, ChevronLeft, CheckCircle2, Rocket, Target, Code, Palette, TrendingUp, Users, Loader2, Activity, Scale, Truck, Lock, Briefcase, BarChart3 } from "lucide-react";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const interests = [
    { id: "frontend", label: "Frontend Development", icon: Code },
    { id: "backend", label: "Backend Development", icon: Target },
    { id: "fullstack", label: "Full Stack Development", icon: Rocket },
    { id: "design", label: "UI/UX Design", icon: Palette },
    { id: "data", label: "Data Science & AI", icon: TrendingUp },
    { id: "devops", label: "DevOps & Cloud", icon: Users },
    { id: "cybersecurity", label: "Cyber Security", icon: Lock },
    { id: "product", label: "Product Management", icon: Briefcase },
    { id: "marketing", label: "Digital Marketing", icon: TrendingUp },
    { id: "finance", label: "Finance & Fintech", icon: BarChart3 },
    { id: "healthcare", label: "Healthcare Tech", icon: Activity },
    { id: "hr", label: "Human Resources", icon: Users },
    { id: "legal", label: "Legal & Compliance", icon: Scale },
    { id: "logistics", label: "Supply Chain", icon: Truck },
    { id: "sales", label: "Sales & BD", icon: Users },
  ];

  const goals = [
    { id: "job", label: "Land a new job" },
    { id: "switch", label: "Switch careers" },
    { id: "promotion", label: "Get a promotion" },
    { id: "skills", label: "Learn new skills" },
  ];

  const experienceLevels = [
    { id: "entry", label: "Student / Fresh Graduate", desc: "0-1 years" },
    { id: "junior", label: "Junior Professional", desc: "1-3 years" },
    { id: "mid", label: "Mid-Level Professional", desc: "3-5 years" },
    { id: "senior", label: "Senior Professional", desc: "5+ years" },
  ];

  const canProceed = () => {
    if (step === 1) return resumeUploaded && !resumeUploading && !resumeParsing;
    if (step === 2) return selectedInterests.length > 0;
    if (step === 3) return selectedGoals.length > 0;
    if (step === 4) return experienceLevel !== null;
    return false;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setResumeUploading(true);

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      toast({
        title: 'Resume uploaded',
        description: 'Now parsing your resume with AI...',
      });

      setResumeUploading(false);
      setResumeParsing(true);

      const { data, error: parseError } = await invokeWithFallback('parse-resume', {
        body: { fileUrl: fileName, userId: user.id },
      });

      if (parseError) throw parseError;

      if (data.success) {
        setResumeUploaded(true);
        toast({
          title: 'Resume parsed successfully!',
          description: `Extracted ${data.skills_added || 0} skills from your resume`,
        });
      } else {
        throw new Error(data.error || 'Failed to parse resume');
      }
    } catch (err) {
      console.error('Error:', err);
      // Fallback handles mock data now for resume parsing
    } finally {
      setResumeUploading(false);
      setResumeParsing(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          interests: selectedInterests,
          goals: selectedGoals,
          experience_level: experienceLevel as "entry" | "junior" | "mid" | "senior" | "lead",
          career_readiness_score: 25, // Initial score
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create initial skills based on interests
      const skillsToCreate = generateSkillsFromInterests(selectedInterests, user.id);

      if (skillsToCreate.length > 0) {
        const { error: skillsError } = await supabase
          .from("skills")
          .insert(skillsToCreate);

        if (skillsError) throw skillsError;
      }

      // Create initial career memory
      const { error: memoryError } = await supabase
        .from("career_memory")
        .insert({
          user_id: user.id,
          memory_type: "onboarding_complete",
          content: {
            interests: selectedInterests,
            goals: selectedGoals,
            experienceLevel,
            completedAt: new Date().toISOString(),
          },
        });

      if (memoryError) throw memoryError;

      // Fetch real job opportunities based on user interests
      const interestToRole: Record<string, string> = {
        frontend: "Frontend Developer",
        backend: "Backend Developer",
        fullstack: "Full Stack Developer",
        design: "UI UX Designer",
        data: "Data Scientist",
        devops: "DevOps Engineer",
      };

      const searchRole = selectedInterests.length > 0
        ? interestToRole[selectedInterests[0]] || "Software Developer"
        : "Software Developer";

      try {
        const { data: jobsData, error: jobsError } = await invokeWithFallback('fetch-jobs', {
          body: { query: searchRole, location: "", userId: user.id },
        });

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
        } else if (jobsData?.jobs?.length === 0) {
          // If no jobs found from API, don't insert any - user can search later
          console.log("No jobs found from API");
        }
      } catch (jobFetchError) {
        console.error("Job fetch error:", jobFetchError);
        // Continue without jobs - not a critical error
      }

      toast({
        title: "Profile created!",
        description: "Your AI career agents are now active.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSkillsFromInterests = (interests: string[], userId: string) => {
    const skillMap: Record<string, { name: string; category: string; proficiency: number; status: "not_started" | "in_progress" | "completed" }[]> = {
      frontend: [
        { name: "HTML & CSS", category: "Frontend", proficiency: 60, status: "in_progress" },
        { name: "JavaScript", category: "Frontend", proficiency: 50, status: "in_progress" },
        { name: "React", category: "Frontend", proficiency: 30, status: "in_progress" },
        { name: "TypeScript", category: "Frontend", proficiency: 0, status: "not_started" },
      ],
      backend: [
        { name: "Node.js", category: "Backend", proficiency: 40, status: "in_progress" },
        { name: "Databases", category: "Backend", proficiency: 30, status: "in_progress" },
        { name: "REST APIs", category: "Backend", proficiency: 0, status: "not_started" },
      ],
      fullstack: [
        { name: "React", category: "Frontend", proficiency: 40, status: "in_progress" },
        { name: "Node.js", category: "Backend", proficiency: 35, status: "in_progress" },
        { name: "Databases", category: "Backend", proficiency: 25, status: "in_progress" },
      ],
      design: [
        { name: "UI Design", category: "Design", proficiency: 50, status: "in_progress" },
        { name: "Figma", category: "Design", proficiency: 40, status: "in_progress" },
        { name: "UX Research", category: "Design", proficiency: 0, status: "not_started" },
      ],
      data: [
        { name: "Python", category: "Data Science", proficiency: 45, status: "in_progress" },
        { name: "SQL", category: "Data Science", proficiency: 30, status: "in_progress" },
        { name: "Machine Learning", category: "Data Science", proficiency: 0, status: "not_started" },
      ],
      devops: [
        { name: "Docker", category: "DevOps", proficiency: 35, status: "in_progress" },
        { name: "CI/CD", category: "DevOps", proficiency: 20, status: "in_progress" },
        { name: "Cloud Platforms", category: "DevOps", proficiency: 0, status: "not_started" },
      ],
    };

    const skills: { name: string; category: string; proficiency: number; status: "not_started" | "in_progress" | "completed"; user_id: string }[] = [];
    const addedSkills = new Set<string>();

    interests.forEach((interest) => {
      const interestSkills = skillMap[interest] || [];
      interestSkills.forEach((skill) => {
        if (!addedSkills.has(skill.name)) {
          addedSkills.add(skill.name);
          skills.push({ ...skill, user_id: userId });
        }
      });
    });

    return skills;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareerPilot AI</span>
          </div>
          <div className="text-muted-foreground text-sm">Step {step} of 4</div>
        </div>
      </header>
      <Progress value={(step / 4) * 100} variant="gradient" className="h-1 rounded-none" />

      <main className="flex-1 container mx-auto px-6 py-12 max-w-3xl">
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">Let's start with your resume</h1>
              <p className="text-muted-foreground">Our AI will analyze your experience and skills.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Card
              variant="glass"
              className={`cursor-pointer transition-all ${resumeUploaded ? "border-success" : "hover:border-primary/50"}`}
              onClick={() => !resumeUploading && !resumeParsing && !resumeUploaded && fileInputRef.current?.click()}
            >
              <CardContent className="p-12 text-center">
                {resumeUploading ? (
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    </div>
                    <p className="font-semibold">Uploading resume...</p>
                    <p className="text-muted-foreground text-sm">Please wait</p>
                  </div>
                ) : resumeParsing ? (
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <p className="font-semibold">AI is analyzing your resume...</p>
                    <p className="text-muted-foreground text-sm">This may take a moment</p>
                  </div>
                ) : resumeUploaded ? (
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <p className="font-semibold">Resume Uploaded Successfully</p>
                    <p className="text-muted-foreground text-sm">Your skills have been extracted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-semibold">Drop your resume here</p>
                    <p className="text-muted-foreground text-sm">PDF files only, max 10MB</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">What are you interested in?</h1>
              <p className="text-muted-foreground">Select all areas that match your interests.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {interests.map((i) => (
                <Card key={i.id} className={`cursor-pointer transition-all ${selectedInterests.includes(i.id) ? "border-primary bg-primary/10" : "hover:border-primary/50"}`} onClick={() => setSelectedInterests(p => p.includes(i.id) ? p.filter(x => x !== i.id) : [...p, i.id])}>
                  <CardContent className="p-6 text-center">
                    <i.icon className={`h-8 w-8 mx-auto mb-3 ${selectedInterests.includes(i.id) ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">{i.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">What are your career goals?</h1>
              <p className="text-muted-foreground">This helps our agents create your roadmap.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {goals.map((g) => (
                <Card key={g.id} className={`cursor-pointer transition-all ${selectedGoals.includes(g.id) ? "border-primary bg-primary/10" : "hover:border-primary/50"}`} onClick={() => setSelectedGoals(p => p.includes(g.id) ? p.filter(x => x !== g.id) : [...p, g.id])}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedGoals.includes(g.id) ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {selectedGoals.includes(g.id) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium">{g.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">What's your experience level?</h1>
              <p className="text-muted-foreground">This calibrates our recommendations.</p>
            </div>
            <div className="space-y-4">
              {experienceLevels.map((l) => (
                <Card key={l.id} className={`cursor-pointer transition-all ${experienceLevel === l.id ? "border-primary bg-primary/10" : "hover:border-primary/50"}`} onClick={() => setExperienceLevel(l.id)}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div><p className="font-medium">{l.label}</p><p className="text-muted-foreground text-sm">{l.desc}</p></div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${experienceLevel === l.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {experienceLevel === l.id && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
          {step < 4 ? (
            <Button variant="hero" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>Continue<ChevronRight className="h-4 w-4 ml-2" /></Button>
          ) : (
            <Button variant="hero" onClick={saveProfile} disabled={!canProceed() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Launch My Career AI
              <Rocket className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default OnboardingPage;
