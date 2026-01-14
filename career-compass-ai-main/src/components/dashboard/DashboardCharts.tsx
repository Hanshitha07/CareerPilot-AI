import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SkillProgressChartProps {
  skills: Array<{ name: string; proficiency: number; status: string }>;
}

interface ApplicationStats {
  saved: number;
  applied: number;
  interviewing: number;
  offered: number;
  rejected: number;
  accepted: number;
}

interface InterviewStats {
  totalSessions: number;
  averageScore: number;
  completedCount: number;
}

const CHART_COLORS = {
  primary: "hsl(142 76% 36%)",
  secondary: "hsl(142 60% 45%)",
  accent: "hsl(142 40% 55%)",
  muted: "hsl(142 20% 88%)",
  success: "hsl(142 76% 36%)",
  warning: "hsl(38 92% 50%)",
  destructive: "hsl(0 84% 60%)",
};

export const SkillProgressChart = ({ skills }: SkillProgressChartProps) => {
  const chartData = useMemo(() => {
    return skills.slice(0, 8).map((skill) => ({
      name: skill.name.length > 12 ? skill.name.substring(0, 12) + "..." : skill.name,
      proficiency: skill.proficiency,
      target: 100,
    }));
  }, [skills]);

  if (skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Progress</CardTitle>
          <CardDescription>Your skill proficiency levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Complete onboarding to see skill progress
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill Progress</CardTitle>
        <CardDescription>Your skill proficiency levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(142 20% 88%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(142 15% 45%)" />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 12, fill: "hsl(0 0% 95%)", fontWeight: 500 }}
                stroke="hsl(142 15% 45%)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(142 20% 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [`${value}%`, "Proficiency"]}
              />
              <Bar dataKey="proficiency" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const ApplicationStatsChart = ({ stats }: { stats: ApplicationStats }) => {
  const chartData = useMemo(() => {
    return [
      { name: "Saved", value: stats.saved, color: CHART_COLORS.muted },
      { name: "Applied", value: stats.applied, color: CHART_COLORS.primary },
      { name: "Interviewing", value: stats.interviewing, color: CHART_COLORS.secondary },
      { name: "Offered", value: stats.offered, color: CHART_COLORS.success },
      { name: "Rejected", value: stats.rejected, color: CHART_COLORS.destructive },
      { name: "Accepted", value: stats.accepted, color: CHART_COLORS.accent },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Pipeline</CardTitle>
          <CardDescription>Track your job applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No applications yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Application Pipeline</CardTitle>
        <CardDescription>Track your job applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(142 20% 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => [`${value} jobs`, name]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const InterviewPerformanceChart = ({ stats }: { stats: InterviewStats }) => {
  const performanceData = useMemo(() => {
    // Generate mock performance trend data
    const baseScore = stats.averageScore || 70;
    return [
      { session: "1", score: Math.max(0, baseScore - 15) },
      { session: "2", score: Math.max(0, baseScore - 10) },
      { session: "3", score: Math.max(0, baseScore - 5) },
      { session: "4", score: baseScore },
      { session: "5", score: Math.min(100, baseScore + 5) },
    ].slice(0, Math.max(1, stats.totalSessions));
  }, [stats]);

  if (stats.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interview Performance</CardTitle>
          <CardDescription>Your mock interview scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Complete mock interviews to see performance
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Interview Performance</CardTitle>
        <CardDescription>Your mock interview scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(142 20% 88%)" />
              <XAxis dataKey="session" tick={{ fontSize: 12 }} stroke="hsl(142 15% 45%)" label={{ value: "Session", position: "bottom", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(142 15% 45%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(142 20% 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [`${value}%`, "Score"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const SkillDistributionChart = ({ skills }: SkillProgressChartProps) => {
  const distributionData = useMemo(() => {
    const notStarted = skills.filter((s) => s.status === "not_started").length;
    const inProgress = skills.filter((s) => s.status === "in_progress").length;
    const completed = skills.filter((s) => s.status === "completed").length;

    return [
      { name: "Not Started", value: notStarted, color: CHART_COLORS.muted },
      { name: "In Progress", value: inProgress, color: CHART_COLORS.warning },
      { name: "Completed", value: completed, color: CHART_COLORS.success },
    ].filter((item) => item.value > 0);
  }, [skills]);

  if (skills.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill Status</CardTitle>
        <CardDescription>Distribution by completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 100%)",
                  border: "1px solid hsl(142 20% 88%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => [`${value} skills`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
