import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, Plus, Trash2, Video, Phone, Users, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InterviewSchedule {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  notes: string | null;
}

interface InterviewSchedulerProps {
  opportunityId: string;
  userId: string;
  companyName: string;
}

const interviewTypes = [
  { value: "phone", label: "Phone Screen", icon: Phone },
  { value: "video", label: "Video Call", icon: Video },
  { value: "onsite", label: "On-site", icon: MapPin },
  { value: "panel", label: "Panel Interview", icon: Users },
];

const durations = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export const InterviewScheduler = ({ opportunityId, userId, companyName }: InterviewSchedulerProps) => {
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [interviewType, setInterviewType] = useState("video");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadSchedules();
  }, [opportunityId]);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_schedules")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the interview",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from("interview_schedules").insert({
        opportunity_id: opportunityId,
        user_id: userId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: duration,
        interview_type: interviewType,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Interview scheduled!",
        description: `Interview with ${companyName} on ${format(scheduledAt, "PPP 'at' p")}`,
      });

      // Reset form
      setDate(undefined);
      setTime("09:00");
      setDuration(60);
      setInterviewType("video");
      setNotes("");
      setShowForm(false);
      loadSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("interview_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Interview removed",
        description: "The interview has been removed from your schedule",
      });
      loadSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    const found = interviewTypes.find(t => t.value === type);
    return found ? found.icon : Video;
  };

  const isUpcoming = (scheduledAt: string) => new Date(scheduledAt) > new Date();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Interview Schedule
        </CardTitle>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-secondary/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interview Type</label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interview details, meeting link, interviewer name..."
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Schedule Interview
              </Button>
            </div>
          </div>
        )}

        {schedules.length === 0 && !showForm ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No interviews scheduled yet. Click "Schedule" to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => {
              const Icon = getInterviewTypeIcon(schedule.interview_type);
              const upcoming = isUpcoming(schedule.scheduled_at);
              
              return (
                <div 
                  key={schedule.id} 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    upcoming ? "bg-primary/5 border-primary/20" : "bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    upcoming ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      upcoming ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {format(new Date(schedule.scheduled_at), "EEEE, MMM d 'at' h:mm a")}
                      </p>
                      {upcoming && (
                        <Badge variant="default" className="text-xs">Upcoming</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {schedule.duration_minutes} min
                      </span>
                      <span className="capitalize">{schedule.interview_type}</span>
                    </div>
                    {schedule.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {schedule.notes}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
