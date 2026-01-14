import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { mockState } from "@/lib/mock-state";
import { Loader2, ChevronLeft, ChevronRight, Clock, MapPin, Video, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";

interface Interview {
  id: string;
  scheduled_at: string;
  interview_type: string | null;
  duration_minutes: number | null;
  notes: string | null;
  opportunity_id: string;
  opportunity?: {
    title: string;
    company: string;
  };
}

const interviewTypeIcons: Record<string, React.ElementType> = {
  phone: Phone,
  video: Video,
  onsite: MapPin,
  panel: Users,
};

const interviewTypeColors: Record<string, string> = {
  phone: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  video: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  onsite: "bg-green-500/10 text-green-500 border-green-500/20",
  panel: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const CalendarPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadInterviews();
    }
  }, [user]);

  const loadInterviews = async () => {
    // Simulate loading
    setTimeout(() => {
      const mockEvents = mockState.getEvents(user.id);

      const mappedInterviews: Interview[] = mockEvents.map(evt => ({
        id: evt.id,
        scheduled_at: evt.date,
        interview_type: evt.type === 'interview' ? 'video' : 'phone',
        duration_minutes: 45,
        notes: evt.type === 'application' ? 'Application Submitted' : 'Mock Interview Session',
        opportunity_id: evt.jobId,
        opportunity: {
          title: evt.title.replace('Application: ', '').replace('Mock Interview: ', ''),
          company: evt.company
        }
      }));

      setInterviews(mappedInterviews);
      setLoading(false);
    }, 300);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning of the month to start on Sunday
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter(interview =>
      isSameDay(new Date(interview.scheduled_at), date)
    );
  };

  const selectedDateInterviews = selectedDate
    ? getInterviewsForDate(selectedDate)
    : [];

  const upcomingInterviews = interviews
    .filter(i => new Date(i.scheduled_at) >= new Date())
    .slice(0, 5);

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
        <PageTransition>
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Interview Calendar</h1>
              <p className="text-muted-foreground">
                View and manage all your scheduled interviews.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {paddedDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      const dayInterviews = getInterviewsForDate(day);
                      const hasInterviews = dayInterviews.length > 0;
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            aspect-square p-1 rounded-lg transition-all relative
                            ${isToday(day) ? "ring-2 ring-primary" : ""}
                            ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}
                          `}
                        >
                          <span className="text-sm">{format(day, "d")}</span>
                          {hasInterviews && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {dayInterviews.slice(0, 3).map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"
                                    }`}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Date / Upcoming */}
              <div className="space-y-6">
                {selectedDate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {format(selectedDate, "EEEE, MMMM d")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDateInterviews.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No interviews scheduled for this day.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedDateInterviews.map(interview => {
                            const Icon = interviewTypeIcons[interview.interview_type || "video"] || Video;
                            const colorClass = interviewTypeColors[interview.interview_type || "video"];

                            return (
                              <div
                                key={interview.id}
                                className="p-3 rounded-lg border bg-card"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {interview.opportunity?.title || "Interview"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {interview.opportunity?.company}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {format(new Date(interview.scheduled_at), "h:mm a")}
                                        {interview.duration_minutes && ` (${interview.duration_minutes}m)`}
                                      </span>
                                    </div>
                                    {interview.notes && (
                                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                        {interview.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Interviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingInterviews.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No upcoming interviews scheduled.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingInterviews.map(interview => (
                          <div
                            key={interview.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                            onClick={() => setSelectedDate(new Date(interview.scheduled_at))}
                          >
                            <Badge variant="outline" className="shrink-0">
                              {format(new Date(interview.scheduled_at), "MMM d")}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {interview.opportunity?.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(interview.scheduled_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default CalendarPage;
