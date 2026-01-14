import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithFallback } from "@/lib/api-fallbacks";
import { useToast } from "@/hooks/use-toast";
import { mockState } from "@/lib/mock-state";
import { Target, TrendingUp, Briefcase, GraduationCap, MessageSquare, ChevronRight, MapPin, Building2, CheckCircle2, ArrowUpRight, BarChart3, Users, Clock, Sparkles, Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ResumeUpload } from "@/components/ResumeUpload";
import { NotificationSettings } from "@/components/NotificationSettings";
import { PageTransition } from "@/components/PageTransition";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SkillProgressChart, ApplicationStatsChart, InterviewPerformanceChart, SkillDistributionChart } from "@/components/dashboard/DashboardCharts";

interface Profile {
  full_name: string | null;
  target_role: string | null;
  career_readiness_score: number;
}

interface Skill {
  id: string;
  name: string;
  proficiency: number;
  status: string;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string | null;
  fit_score: number;
  type: string | null;
  status: string | null;
}

interface InterviewSession {
  id: string;
  score: number | null;
  completed_at: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, career_readiness_score, target_role")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: skillsData } = await supabase
        .from("skills")
        .select("id, name, proficiency, status")
        .eq("user_id", user.id)
        .order("proficiency", { ascending: false });

      if (skillsData) setSkills(skillsData);

      const { data: oppData } = await supabase
        .from("opportunities")
        .select("id, title, company, location, fit_score, type, status")
        .eq("user_id", user.id)
        .order("fit_score", { ascending: false })
        .limit(3);

      if (oppData) setOpportunities(oppData);

      const { data: allOppData } = await supabase
        .from("opportunities")
        .select("id, title, company, location, fit_score, type, status")
        .eq("user_id", user.id);

      if (allOppData) setAllOpportunities(allOppData);

      const { data: interviewData } = await supabase
        .from("interview_sessions")
        .select("id, score, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (interviewData) setInterviewSessions(interviewData);

      // Load suggested roles from latest resume
      const { data: memoryData } = await supabase
        .from("career_memory")
        .select("content")
        .eq("user_id", user.id)
        .eq("memory_type", "resume_parsed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (memoryData && memoryData.length > 0) {
        const content = memoryData[0].content as any;
        if (content && content.target_roles) {
          setSuggestedRoles(content.target_roles);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const readinessScore = profile?.career_readiness_score || 0;
  const completedSkills = skills.filter(s => s.status === "completed").length;
  const totalSkills = skills.length;
  const skillProgress = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  const avgProficiency = skills.length > 0
    ? Math.round(skills.reduce((acc, s) => acc + s.proficiency, 0) / skills.length)
    : 0;


  // Fetch mock analytics to supplement or replace real data if empty
  const mockAnalytics = user ? mockState.getAnalytics(user.id) : null;

  // Use mock data for application stats if available, merging with any real data if necessary
  // For demo consistency, we prioritize the mockState analytics which drives the demo flow
  const applicationStats = {
    saved: allOpportunities.filter(o => o.status === "saved").length,
    applied: mockAnalytics ? mockAnalytics.totalApplications : allOpportunities.filter(o => o.status === "applied").length,
    interviewing: mockAnalytics ? Math.round(mockAnalytics.totalApplications * (mockAnalytics.interviewRate / 100)) : allOpportunities.filter(o => o.status === "interviewing").length,
    offered: mockAnalytics ? Math.round(mockAnalytics.totalApplications * (mockAnalytics.offerRate / 100)) : allOpportunities.filter(o => o.status === "offered").length,
    rejected: allOpportunities.filter(o => o.status === "rejected").length,
    accepted: allOpportunities.filter(o => o.status === "accepted").length,
  };

  const completedInterviews = interviewSessions.filter(s => s.completed_at);
  const interviewStats = {
    totalSessions: interviewSessions.length,
    averageScore: completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((acc, s) => acc + (s.score || 0), 0) / completedInterviews.length)
      : 0,
    completedCount: completedInterviews.length,
  };

  const profileComplete = !!(profile?.full_name);

  const handleDiscoverJobs = async () => {
    if (!user) return;

    setIsFetchingJobs(true);
    try {
      const searchRole = suggestedRoles[0] || profile?.target_role || "Software Developer";
      const { data, error } = await invokeWithFallback('fetch-jobs', {
        body: { query: searchRole, location: "", userId: user.id },
      });

      if (error) throw error;

      if (data?.success) {
        // Reload dashboard data to show new jobs
        await loadDashboardData();
      }
    } catch (error) {
      console.error("Error discovering jobs:", error);
    } finally {
      setIsFetchingJobs(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </main>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: { title: string; value: string | number; subtitle: string; icon: any; trend?: string }) => (
    <Card className="border-border/50 hover:shadow-card-hover transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1 text-xs text-success">
            <ArrowUpRight className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-auto">

        <main className="flex-1 p-6 lg:p-8">
          <PageTransition>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Dashboard Overview</p>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/opportunities">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Briefcase className="h-4 w-4" />
                      Browse Jobs
                    </Button>
                  </Link>
                  <Link to="/interview">
                    <Button size="sm" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Start Interview
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Career Score"
                  value={`${readinessScore}%`}
                  subtitle="Based on market analysis"
                  icon={Target}
                  trend={readinessScore > 0 ? "+5% this week" : undefined}
                />
                <MetricCard
                  title="Skills Tracked"
                  value={totalSkills}
                  subtitle={`${completedSkills} completed`}
                  icon={GraduationCap}
                />
                <MetricCard
                  title="Opportunities"
                  value={allOpportunities.length}
                  subtitle={`${applicationStats.applied} applied`}
                  icon={Briefcase}
                />
                <MetricCard
                  title="Interviews"
                  value={interviewStats.completedCount}
                  subtitle={interviewStats.averageScore > 0 ? `${interviewStats.averageScore}% avg score` : "No scores yet"}
                  icon={Users}
                />
              </div>

              {/* Analytics Charts */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SkillProgressChart skills={skills} />
                <ApplicationStatsChart stats={applicationStats} />
                <InterviewPerformanceChart stats={interviewStats} />
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Career Readiness Card */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Career Readiness</CardTitle>
                          <CardDescription>Your progress based on market requirements</CardDescription>
                        </div>
                        <Badge variant="outline" className="font-medium">
                          {readinessScore > 50 ? "On Track" : "Building"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-8">
                        <div className="relative h-28 w-28 flex-shrink-0">
                          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                            <circle
                              cx="50" cy="50" r="40"
                              stroke="hsl(var(--primary))"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${readinessScore * 2.51} 251`}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{readinessScore}%</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Technical Proficiency</span>
                              <span className="font-medium">{avgProficiency}%</span>
                            </div>
                            <Progress value={avgProficiency} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Skills Completion</span>
                              <span className="font-medium">{skillProgress}%</span>
                            </div>
                            <Progress value={skillProgress} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Application Progress</span>
                              <span className="font-medium">{Math.min(applicationStats.applied * 10, 100)}%</span>
                            </div>
                            <Progress value={Math.min(applicationStats.applied * 10, 100)} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggested Roles Section */}
                  {suggestedRoles.length > 0 && (
                    <Card className="border-border/50 bg-primary/5 border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg font-semibold">Recommended Career Paths</CardTitle>
                        </div>
                        <CardDescription>Based on your latest resume analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {suggestedRoles.map((role, idx) => (
                            <Badge
                              key={idx}
                              className="px-3 py-1 text-sm bg-background hover:bg-muted text-foreground border-primary/20 transition-colors"
                              variant="outline"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Skills Section */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Skill Development</CardTitle>
                          <CardDescription>Your personalized learning path</CardDescription>
                        </div>
                        <Link to="/roadmap">
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                            View All
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-muted/50">
                        <Progress value={skillProgress} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {completedSkills} of {totalSkills} completed
                        </span>
                      </div>
                      <div className="space-y-3">
                        {skills.slice(0, 4).map((skill) => (
                          <div
                            key={skill.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200"
                          >
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${skill.status === "completed"
                              ? "bg-success/10"
                              : skill.proficiency > 0
                                ? "bg-primary/10"
                                : "bg-muted"
                              }`}>
                              {skill.status === "completed"
                                ? <CheckCircle2 className="h-4 w-4 text-success" />
                                : <GraduationCap className={`h-4 w-4 ${skill.proficiency > 0 ? "text-primary" : "text-muted-foreground"}`} />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{skill.name}</p>
                              <p className="text-xs text-muted-foreground">{skill.proficiency}% proficiency</p>
                            </div>
                            <div className="w-20">
                              <Progress value={skill.proficiency} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                        {skills.length === 0 && (
                          <div className="text-center py-8">
                            <GraduationCap className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Complete onboarding to see your skills</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opportunities Section */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Suggested Jobs</CardTitle>
                          <CardDescription>Best matches for your profile</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={handleDiscoverJobs}
                            disabled={isFetchingJobs}
                          >
                            {isFetchingJobs ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            Discover
                          </Button>
                          <Link to="/opportunities">
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                              View All
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {opportunities.map((o) => (
                          <Link to={`/opportunities/${o.id}`} key={o.id}>
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200 cursor-pointer group">
                              <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                  <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{o.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>{o.company}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {o.location || "Remote"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={o.fit_score >= 90 ? "default" : "secondary"}
                                  className={o.fit_score >= 90 ? "bg-success text-success-foreground" : ""}
                                >
                                  {o.fit_score}% match
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">{o.type}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {opportunities.length === 0 && (
                          <div className="text-center py-8">
                            <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No opportunities yet</p>
                            <Link to="/opportunities" className="text-sm text-primary hover:underline mt-1 inline-block">
                              Browse available jobs
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-4">
                  <SkillDistributionChart skills={skills} />

                  {/* Quick Actions */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Link to="/interview" className="block">
                        <Button variant="outline" className="w-full justify-between h-11 group">
                          <span className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Mock Interview
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/roadmap" className="block">
                        <Button variant="outline" className="w-full justify-between h-11 group">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            View Roadmap
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/analytics" className="block">
                        <Button variant="outline" className="w-full justify-between h-11 group">
                          <span className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <ResumeUpload onParseComplete={() => loadDashboardData()} />

                  <NotificationSettings />
                </div>
              </div>
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
