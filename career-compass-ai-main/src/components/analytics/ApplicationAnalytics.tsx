import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, Clock, Target, CheckCircle, ArrowRight, Download, FileText, Lightbulb, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface Opportunity {
  id: string;
  status: string;
  company: string; // Added company name
  title: string; // Added title
  created_at: string;
  applied_at: string | null;
  feedback?: string;
  next_step?: string;
}

interface InterviewSession {
  id: string;
  score: number | null;
  completed_at: string | null;
}

interface ApplicationAnalyticsProps {
  opportunities: Opportunity[];
  interviews: InterviewSession[];
}

const COLORS = {
  saved: "hsl(var(--muted-foreground))",
  applied: "hsl(var(--primary))",
  interviewing: "hsl(var(--warning))",
  offered: "hsl(var(--success))",
  rejected: "hsl(var(--destructive))",
  accepted: "hsl(142, 76%, 36%)",
};

export const ApplicationAnalytics = ({ opportunities, interviews }: ApplicationAnalyticsProps) => {
  const { toast } = useToast();

  // Calculate conversion funnel data first (needed by export functions)
  const statusCounts = {
    saved: opportunities.filter(o => o.status === "saved").length,
    applied: opportunities.filter(o => o.status === "applied").length,
    interviewing: opportunities.filter(o => o.status === "interviewing").length,
    offered: opportunities.filter(o => o.status === "offered").length,
    accepted: opportunities.filter(o => o.status === "accepted").length,
    rejected: opportunities.filter(o => o.status === "rejected").length,
  };

  const funnelData = [
    { name: "Saved", value: statusCounts.saved, fill: COLORS.saved },
    { name: "Applied", value: statusCounts.applied, fill: COLORS.applied },
    { name: "Interviewing", value: statusCounts.interviewing, fill: COLORS.interviewing },
    { name: "Offered", value: statusCounts.offered, fill: COLORS.offered },
    { name: "Accepted", value: statusCounts.accepted, fill: COLORS.accepted },
  ];

  // Calculate conversion rates
  const totalApplications = statusCounts.applied + statusCounts.interviewing + statusCounts.offered + statusCounts.accepted + statusCounts.rejected;
  const interviewRate = totalApplications > 0
    ? ((statusCounts.interviewing + statusCounts.offered + statusCounts.accepted) / totalApplications * 100).toFixed(1)
    : "0";
  const offerRate = totalApplications > 0
    ? ((statusCounts.offered + statusCounts.accepted) / totalApplications * 100).toFixed(1)
    : "0";
  const acceptRate = (statusCounts.offered + statusCounts.accepted) > 0
    ? (statusCounts.accepted / (statusCounts.offered + statusCounts.accepted) * 100).toFixed(1)
    : "0";

  // Calculate time-to-hire metrics
  const calculateDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const appliedOpportunities = opportunities.filter(o => o.applied_at);
  const avgTimeToApply = appliedOpportunities.length > 0
    ? (appliedOpportunities.reduce((sum, o) => sum + calculateDaysBetween(o.created_at, o.applied_at!), 0) / appliedOpportunities.length).toFixed(1)
    : "N/A";

  // Interview performance over time
  const completedInterviews = interviews.filter(i => i.completed_at && i.score !== null);
  const interviewPerformanceData = completedInterviews
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime())
    .slice(-10)
    .map((interview, index) => ({
      session: `#${index + 1}`,
      score: interview.score,
    }));

  const avgInterviewScore = completedInterviews.length > 0
    ? (completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length).toFixed(0)
    : "N/A";

  // Distribution pie chart data
  const distributionData = Object.entries(statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: COLORS[key as keyof typeof COLORS],
    }));

  const exportToCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Applications", totalApplications.toString()],
      ["Interview Rate", `${interviewRate}%`],
      ["Offer Rate", `${offerRate}%`],
      ["Accept Rate", `${acceptRate}%`],
      ["Avg Days to Apply", avgTimeToApply.toString()],
      ["Avg Interview Score", avgInterviewScore.toString()],
      ["", ""],
      ["Status", "Count"],
      ["Saved", statusCounts.saved.toString()],
      ["Applied", statusCounts.applied.toString()],
      ["Interviewing", statusCounts.interviewing.toString()],
      ["Offered", statusCounts.offered.toString()],
      ["Accepted", statusCounts.accepted.toString()],
      ["Rejected", statusCounts.rejected.toString()],
    ];

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `career-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({ title: "CSV exported successfully" });
  };

  const exportToPDF = () => {
    const content = `
CAREER ANALYTICS REPORT
Generated: ${new Date().toLocaleDateString()}

KEY METRICS
-----------
Total Applications: ${totalApplications}
Interview Rate: ${interviewRate}%
Offer Rate: ${offerRate}%
Accept Rate: ${acceptRate}%
Average Days to Apply: ${avgTimeToApply}
Average Interview Score: ${avgInterviewScore}

STATUS BREAKDOWN
----------------
Saved: ${statusCounts.saved}
Applied: ${statusCounts.applied}
Interviewing: ${statusCounts.interviewing}
Offered: ${statusCounts.offered}
Accepted: ${statusCounts.accepted}
Rejected: ${statusCounts.rejected}
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `career-analytics-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();

    toast({ title: "Report exported successfully" });
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Total Applications</span>
            </div>
            <p className="text-2xl font-bold">{totalApplications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Interview Rate</span>
            </div>
            <p className="text-2xl font-bold text-primary">{interviewRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Offer Rate</span>
            </div>
            <p className="text-2xl font-bold text-success">{offerRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg. Days to Apply</span>
            </div>
            <p className="text-2xl font-bold">{avgTimeToApply}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Application Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No application data yet. Start applying to jobs to see your funnel.
            </p>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {distributionData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interview Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Interview Performance</span>
              {avgInterviewScore !== "N/A" && (
                <Badge variant="secondary">Avg: {avgInterviewScore}%</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewPerformanceData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Complete mock interviews to track performance
              </p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interviewPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="text-center px-4 py-2">
              <p className="text-2xl font-bold">{statusCounts.saved}</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center px-4 py-2">
              <p className="text-2xl font-bold text-primary">{statusCounts.applied}</p>
              <p className="text-xs text-muted-foreground">Applied</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center px-4 py-2">
              <p className="text-2xl font-bold text-warning">{statusCounts.interviewing}</p>
              <p className="text-xs text-muted-foreground">Interviewing</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center px-4 py-2">
              <p className="text-2xl font-bold text-success">{statusCounts.offered}</p>
              <p className="text-xs text-muted-foreground">Offered</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center px-4 py-2">
              <p className="text-2xl font-bold text-success">{statusCounts.accepted}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </div>
          <div className="text-center mt-4 pt-4 border-t">
            <Badge variant="destructive">{statusCounts.rejected} Rejected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights & Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Interview Insights & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.filter(o => o.feedback || o.next_step).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No insights available yet. Apply to more jobs to receive feedback.
              </p>
            ) : (
              opportunities
                .filter(o => o.feedback || o.next_step)
                .slice(0, 5)
                .map((opp) => (
                  <div key={opp.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{opp.company}</p>
                      </div>
                      <Badge variant={
                        opp.status === 'rejected' ? 'destructive' :
                          opp.status === 'offered' ? 'default' :
                            opp.status === 'accepted' ? 'default' : 'secondary'
                      }>
                        {opp.status}
                      </Badge>
                    </div>

                    {opp.feedback && (
                      <div className="flex gap-2 text-sm mt-2 p-2 bg-background/50 rounded">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{opp.feedback}</span>
                      </div>
                    )}

                    {opp.next_step && (
                      <div className="flex gap-2 text-sm mt-2 p-2 bg-primary/5 rounded border border-primary/10">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-primary font-medium">{opp.next_step}</span>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div >
  );
};
