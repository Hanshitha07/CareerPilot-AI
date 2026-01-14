import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, MapPin, Clock, DollarSign, Briefcase, 
  ArrowLeft, ExternalLink, Bookmark, Check, Loader2,
  Calendar, Users, Target
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { JobNotes } from "@/components/opportunities/JobNotes";
import { InterviewScheduler } from "@/components/opportunities/InterviewScheduler";

const applicationStatuses = [
  { value: "saved", label: "Saved", color: "bg-secondary" },
  { value: "applied", label: "Applied", color: "bg-primary/20" },
  { value: "interviewing", label: "Interviewing", color: "bg-warning/20" },
  { value: "offered", label: "Offered", color: "bg-success/20" },
  { value: "rejected", label: "Rejected", color: "bg-destructive/20" },
  { value: "accepted", label: "Accepted", color: "bg-success/30" },
];

interface OpportunityDetail {
  id: string;
  title: string;
  company: string;
  location: string | null;
  fit_score: number;
  type: string | null;
  status: string;
  description: string | null;
  created_at: string;
  deadline: string | null;
  salary_range: string | null;
  requirements: string[] | null;
  notes: string | null;
  applied_at: string | null;
}

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadJobDetails();
    }
  }, [user, id]);

  const loadJobDetails = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Job not found",
          description: "This opportunity doesn't exist or you don't have access.",
          variant: "destructive",
        });
        navigate("/opportunities");
        return;
      }
      setJob(data);
    } catch (error) {
      console.error("Error loading job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!job || !user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ 
          status: newStatus as any,
          applied_at: newStatus === "applied" && !job.applied_at ? new Date().toISOString() : job.applied_at
        })
        .eq("id", job.id);

      if (error) throw error;

      setJob({ 
        ...job, 
        status: newStatus, 
        applied_at: newStatus === "applied" && !job.applied_at ? new Date().toISOString() : job.applied_at 
      });

      await supabase.from("career_memory").insert({
        user_id: user.id,
        memory_type: `status_changed_${newStatus}`,
        content: {
          opportunityId: job.id,
          jobTitle: job.title,
          company: job.company,
          previousStatus: job.status,
          newStatus: newStatus,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: "Status updated!",
        description: `Application moved to "${applicationStatuses.find(s => s.value === newStatus)?.label}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return formatDate(dateStr);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <PageTransition>
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link to="/opportunities" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{job.title}</h1>
                  <Badge variant={job.fit_score >= 90 ? "success" : job.fit_score >= 80 ? "default" : "secondary"}>
                    {job.fit_score}% match
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location || "Remote"}
                  </span>
                  {job.type && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Posted {formatRelativeDate(job.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {job.salary_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-success" />
                        <span className="font-semibold text-lg">{job.salary_range}</span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {getDaysUntilDeadline(job.deadline) > 0 
                            ? `${getDaysUntilDeadline(job.deadline)} days left to apply`
                            : "Deadline passed"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Select 
                        value={job.status} 
                        onValueChange={updateStatus}
                        disabled={updating}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {applicationStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {job.status !== "applied" && job.status !== "interviewing" && job.status !== "offered" && job.status !== "accepted" && (
                      <Button 
                        variant="hero"
                        size="lg"
                        onClick={() => updateStatus("applied")}
                        disabled={updating}
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Mark as Applied
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {job.description ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No description available for this position.</p>
                    )}
                  </CardContent>
                </Card>

                {job.requirements && job.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <JobNotes 
                  opportunityId={job.id} 
                  initialNotes={job.notes}
                  onNotesUpdate={(notes) => setJob({ ...job, notes })}
                />

                {(job.status === "applied" || job.status === "interviewing" || job.status === "offered") && user && (
                  <InterviewScheduler 
                    opportunityId={job.id}
                    userId={user.id}
                    companyName={job.company}
                  />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{job.location || "Remote"}</span>
                    </div>
                    {job.type && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Job Type</span>
                        <span className="font-medium">{job.type}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Salary</span>
                        <span className="font-medium text-success">{job.salary_range}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posted</span>
                      <span className="font-medium">{formatDate(job.created_at)}</span>
                    </div>
                    {job.deadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className={`font-medium ${getDaysUntilDeadline(job.deadline) <= 7 ? "text-destructive" : ""}`}>
                          {formatDate(job.deadline)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Fit Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-primary">{job.fit_score}%</div>
                      <p className="text-sm text-muted-foreground mt-1">Match Score</p>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {job.fit_score >= 90 
                        ? "Excellent match! This role aligns very well with your profile."
                        : job.fit_score >= 80 
                        ? "Great match! You have most of the required skills."
                        : job.fit_score >= 70
                        ? "Good match. Consider highlighting relevant experience."
                        : "Moderate match. Review requirements carefully."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default JobDetailPage;
