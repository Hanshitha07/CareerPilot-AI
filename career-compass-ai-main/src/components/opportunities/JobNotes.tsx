import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobNotesProps {
  opportunityId: string;
  initialNotes: string | null;
  onNotesUpdate?: (notes: string) => void;
}

export const JobNotes = ({ opportunityId, initialNotes, onNotesUpdate }: JobNotesProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ notes })
        .eq("id", opportunityId);

      if (error) throw error;

      setIsEditing(false);
      onNotesUpdate?.(notes);
      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          Your Notes
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            {notes ? "Edit" : "Add Notes"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes about this opportunity... (e.g., contact info, interview prep, key requirements)"
              className="min-h-[150px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No notes yet. Click "Add Notes" to save personal notes about this opportunity.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
