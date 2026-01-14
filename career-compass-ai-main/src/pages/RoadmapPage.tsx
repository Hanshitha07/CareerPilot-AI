import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Lock, Loader2, Plus } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string | null;
  proficiency: number;
  status: string;
}

const RoadmapPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSkills();
    }
  }, [user]);

  const loadSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, category, proficiency, status")
        .eq("user_id", user.id)
        .order("proficiency", { ascending: false });

      if (error) throw error;
      if (data) setSkills(data);
    } catch (error) {
      console.error("Error loading skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSkillProgress = async (skillId: string, currentProficiency: number) => {
    const newProficiency = Math.min(currentProficiency + 10, 100);
    const newStatus = newProficiency >= 100 ? "completed" : "in_progress";

    try {
      const { error } = await supabase
        .from("skills")
        .update({ 
          proficiency: newProficiency, 
          status: newStatus 
        })
        .eq("id", skillId);

      if (error) throw error;

      setSkills(skills.map(s => 
        s.id === skillId 
          ? { ...s, proficiency: newProficiency, status: newStatus }
          : s
      ));

      // Update career readiness score
      if (newStatus === "completed") {
        await updateReadinessScore();
      }

      toast({
        title: "Progress updated!",
        description: newStatus === "completed" ? "Skill completed! 🎉" : `+10% proficiency`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateReadinessScore = async () => {
    if (!user) return;

    const completedCount = skills.filter(s => s.status === "completed").length + 1;
    const totalCount = skills.length;
    const newScore = Math.min(Math.round((completedCount / totalCount) * 100), 100);

    await supabase
      .from("profiles")
      .update({ career_readiness_score: newScore })
      .eq("id", user.id);
  };

  const getStatusIcon = (status: string, proficiency: number) => {
    if (status === "completed" || proficiency >= 100) {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
    if (status === "in_progress" || proficiency > 0) {
      return <Circle className="h-5 w-5 text-primary" />;
    }
    return <Lock className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, proficiency: number) => {
    if (status === "completed" || proficiency >= 100) return "success";
    if (status === "in_progress" || proficiency > 0) return "default";
    return "secondary";
  };

  const getStatusLabel = (status: string, proficiency: number) => {
    if (proficiency >= 100) return "completed";
    if (proficiency > 0) return "in-progress";
    return status;
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

  const completedSkills = skills.filter(s => s.status === "completed" || s.proficiency >= 100).length;
  const overallProgress = skills.length > 0 ? Math.round((completedSkills / skills.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Skill Roadmap</h1>
            <p className="text-muted-foreground mb-4">Your personalized learning path to career success.</p>
            <div className="flex items-center gap-4">
              <Progress value={overallProgress} variant="gradient" className="h-3 flex-1 max-w-md" />
              <span className="text-sm font-medium">{completedSkills}/{skills.length} completed</span>
            </div>
          </div>

          {skills.length === 0 ? (
            <Card className="text-center">
              <CardContent className="p-12">
                <p className="text-muted-foreground mb-4">No skills in your roadmap yet.</p>
                <p className="text-sm text-muted-foreground">Complete the onboarding to generate your personalized skill roadmap.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <Card 
                  key={skill.id} 
                  className={`transition-all ${skill.status === "not_started" && skill.proficiency === 0 ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      skill.status === "completed" || skill.proficiency >= 100 
                        ? "bg-success/20" 
                        : skill.proficiency > 0 
                          ? "bg-primary/20" 
                          : "bg-secondary"
                    }`}>
                      {getStatusIcon(skill.status, skill.proficiency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold">{skill.name}</span>
                          {skill.category && (
                            <span className="text-muted-foreground text-sm ml-2">• {skill.category}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadge(skill.status, skill.proficiency)}>
                            {getStatusLabel(skill.status, skill.proficiency)}
                          </Badge>
                          {skill.proficiency < 100 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateSkillProgress(skill.id, skill.proficiency)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Practice
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={skill.proficiency} 
                          variant={skill.proficiency >= 100 ? "success" : "gradient"} 
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">{skill.proficiency}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoadmapPage;
