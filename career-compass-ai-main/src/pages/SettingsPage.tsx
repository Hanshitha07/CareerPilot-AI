import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Bell, FileText, Save, Loader2, Calendar, CheckCircle2, Sparkles, GraduationCap, Key, Eye, EyeOff, ExternalLink } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { NotificationSettings } from "@/components/NotificationSettings";
import { SkillManager } from "@/components/SkillManager";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Profile {
  full_name: string | null;
  email: string | null;
  target_role: string | null;
  experience_level: string | null;
  avatar_url: string | null;
}

interface ResumeParseHistory {
  id: string;
  created_at: string;
  content: {
    skills?: string[];
    experience_level?: string;
    target_roles?: string[];
    raw_text?: string;
  };
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    target_role: "",
    experience_level: "entry",
    avatar_url: null,
  });
  const [resumeHistory, setResumeHistory] = useState<ResumeParseHistory[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, target_role, experience_level, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user.email || "",
          target_role: profileData.target_role || "",
          experience_level: profileData.experience_level || "entry",
          avatar_url: profileData.avatar_url,
        });
      }

      // Load resume parsing history
      const { data: memoryData } = await supabase
        .from("career_memory")
        .select("id, created_at, content")
        .eq("user_id", user.id)
        .eq("memory_type", "resume_parsed")
        .order("created_at", { ascending: false });

      if (memoryData) {
        setResumeHistory(
          memoryData.map((m) => ({
            id: m.id,
            created_at: m.created_at || "",
            content: m.content as ResumeParseHistory["content"],
          }))
        );
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          target_role: profile.target_role,
          experience_level: profile.experience_level as "entry" | "junior" | "mid" | "senior" | "lead",
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-1 years)" },
    { value: "junior", label: "Junior (1-3 years)" },
    { value: "mid", label: "Mid-Level (3-5 years)" },
    { value: "senior", label: "Senior (5-8 years)" },
    { value: "lead", label: "Lead/Principal (8+ years)" },
  ];

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

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, notifications, and view your resume history.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resume
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details and career preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{profile.full_name || "Your Name"}</h3>
                      <p className="text-muted-foreground text-sm">{profile.email}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.full_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={profile.email || ""}
                        disabled
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed here.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Role</Label>
                      <Input
                        id="targetRole"
                        value={profile.target_role || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, target_role: e.target.value })
                        }
                        placeholder="e.g., Software Engineer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Select
                        value={profile.experience_level || "entry"}
                        onValueChange={(value) =>
                          setProfile({ ...profile, experience_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="animate-fade-in">
              <SkillManager />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="animate-fade-in">
              <NotificationSettings />
            </TabsContent>


            {/* Resume History Tab */}
            <TabsContent value="resume" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Resume Parsing History
                  </CardTitle>
                  <CardDescription>
                    View all your parsed resumes and extracted skills.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resumeHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Resume History</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Upload a resume from your dashboard to have it parsed by AI and extract your skills automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumeHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">Resume Parsed Successfully</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {entry.created_at
                                    ? format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")
                                    : "Unknown date"}
                                </div>
                              </div>
                            </div>
                            {entry.content.experience_level && (
                              <Badge variant="outline" className="capitalize">
                                {entry.content.experience_level}
                              </Badge>
                            )}
                          </div>

                          {entry.content.skills && entry.content.skills.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium mb-2 text-muted-foreground">
                                Extracted Skills ({entry.content.skills.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {entry.content.skills.slice(0, 12).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {entry.content.skills.length > 12 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{entry.content.skills.length - 12} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
