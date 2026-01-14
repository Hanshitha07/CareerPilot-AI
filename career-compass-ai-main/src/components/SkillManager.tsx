import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  id: string;
  name: string;
  category: string | null;
  proficiency: number | null;
  status: string | null;
}

const categories = [
  { value: "technical", label: "Technical" },
  { value: "soft", label: "Soft Skills" },
  { value: "language", label: "Languages" },
  { value: "tool", label: "Tools" },
  { value: "framework", label: "Frameworks" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function SkillManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "technical",
    proficiency: 50,
    status: "not_started",
  });

  useEffect(() => {
    if (user) loadSkills();
  }, [user]);

  const loadSkills = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, category, proficiency, status")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setSkills(data || []);
    } catch (err) {
      console.error("Error loading skills:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!user || !newSkill.name.trim()) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("skills").insert({
        user_id: user.id,
        name: newSkill.name.trim(),
        category: newSkill.category,
        proficiency: newSkill.proficiency,
        status: newSkill.status as "not_started" | "in_progress" | "completed",
        target_proficiency: 100,
      });

      if (error) throw error;

      toast({ title: "Skill added", description: `${newSkill.name} has been added to your skills.` });
      setNewSkill({ name: "", category: "technical", proficiency: 50, status: "not_started" });
      setIsAddOpen(false);
      loadSkills();
    } catch (err) {
      console.error("Error adding skill:", err);
      toast({ title: "Error", description: "Failed to add skill.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSkill = async () => {
    if (!user || !editingSkill) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("skills")
        .update({
          name: editingSkill.name,
          category: editingSkill.category,
          proficiency: editingSkill.proficiency,
          status: editingSkill.status as "not_started" | "in_progress" | "completed",
        })
        .eq("id", editingSkill.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Skill updated", description: `${editingSkill.name} has been updated.` });
      setEditingSkill(null);
      loadSkills();
    } catch (err) {
      console.error("Error updating skill:", err);
      toast({ title: "Error", description: "Failed to update skill.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", skill.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Skill deleted", description: `${skill.name} has been removed.` });
      loadSkills();
    } catch (err) {
      console.error("Error deleting skill:", err);
      toast({ title: "Error", description: "Failed to delete skill.", variant: "destructive" });
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "technical": return "bg-primary/20 text-primary";
      case "soft": return "bg-accent/20 text-accent-foreground";
      case "language": return "bg-success/20 text-success";
      case "tool": return "bg-warning/20 text-warning";
      case "framework": return "bg-destructive/20 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "in_progress": return <Badge variant="secondary">In Progress</Badge>;
      default: return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Manage Skills
            </CardTitle>
            <CardDescription>
              Add, edit, or remove skills from your profile. These are used for job matching and roadmap creation.
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
                <DialogDescription>Add a skill to your profile manually.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-name">Skill Name</Label>
                  <Input
                    id="skill-name"
                    placeholder="e.g., React, Python, Project Management"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-category">Category</Label>
                  <Select
                    value={newSkill.category}
                    onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proficiency: {newSkill.proficiency}%</Label>
                  <Slider
                    value={[newSkill.proficiency]}
                    onValueChange={([value]) => setNewSkill({ ...newSkill, proficiency: value })}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-status">Status</Label>
                  <Select
                    value={newSkill.status}
                    onValueChange={(value) => setNewSkill({ ...newSkill, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSkill} disabled={saving || !newSkill.name.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Skill
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Skills Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Add skills manually or upload your resume to extract them automatically.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Skill
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{skill.name}</span>
                      <Badge className={`text-xs ${getCategoryColor(skill.category)}`}>
                        {skill.category || "other"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${skill.proficiency || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{skill.proficiency || 0}%</span>
                      </div>
                      {getStatusBadge(skill.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editingSkill?.id === skill.id} onOpenChange={(open) => !open && setEditingSkill(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingSkill(skill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Skill</DialogTitle>
                        <DialogDescription>Update skill details.</DialogDescription>
                      </DialogHeader>
                      {editingSkill && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Skill Name</Label>
                            <Input
                              value={editingSkill.name}
                              onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={editingSkill.category || "other"}
                              onValueChange={(value) => setEditingSkill({ ...editingSkill, category: value })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Proficiency: {editingSkill.proficiency || 0}%</Label>
                            <Slider
                              value={[editingSkill.proficiency || 0]}
                              onValueChange={([value]) => setEditingSkill({ ...editingSkill, proficiency: value })}
                              max={100}
                              step={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={editingSkill.status || "not_started"}
                              onValueChange={(value) => setEditingSkill({ ...editingSkill, status: value })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {statuses.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSkill(null)}>Cancel</Button>
                        <Button onClick={handleUpdateSkill} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSkill(skill)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
