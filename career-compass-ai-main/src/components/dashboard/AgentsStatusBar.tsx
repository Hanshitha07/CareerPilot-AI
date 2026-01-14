import { useState, useEffect } from "react";
import { Brain, Target, TrendingUp, Briefcase, MessageSquare, BarChart3, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentStatus {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  status: "idle" | "running" | "completed" | "error";
  progress?: number;
  message?: string;
}

interface AgentsStatusBarProps {
  skillsCount: number;
  opportunitiesCount: number;
  interviewsCount: number;
  profileComplete: boolean;
}

const AgentsStatusBar = ({ 
  skillsCount, 
  opportunitiesCount, 
  interviewsCount,
  profileComplete 
}: AgentsStatusBarProps) => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  useEffect(() => {
    // Determine agent statuses based on real data
    const agentStatuses: AgentStatus[] = [
      { 
        id: "profile", 
        name: "Profile Agent", 
        shortName: "Profile",
        icon: Brain, 
        status: profileComplete ? "completed" : "running",
        progress: profileComplete ? 100 : 50,
        message: profileComplete ? "Profile analyzed" : "Analyzing profile..."
      },
      { 
        id: "market", 
        name: "Market Agent", 
        shortName: "Market",
        icon: Target, 
        status: skillsCount > 0 ? "completed" : "running",
        progress: skillsCount > 0 ? 100 : 30,
        message: skillsCount > 0 ? `${skillsCount} skills tracked` : "Scanning market..."
      },
      { 
        id: "roadmap", 
        name: "Roadmap Agent", 
        shortName: "Roadmap",
        icon: TrendingUp, 
        status: skillsCount > 0 ? "completed" : "idle",
        progress: skillsCount > 0 ? 100 : 0,
        message: skillsCount > 0 ? "Learning path ready" : "Waiting for data..."
      },
      { 
        id: "opportunity", 
        name: "Opportunity Agent", 
        shortName: "Jobs",
        icon: Briefcase, 
        status: opportunitiesCount > 0 ? "completed" : "running",
        progress: opportunitiesCount > 0 ? 100 : 60,
        message: opportunitiesCount > 0 ? `${opportunitiesCount} jobs found` : "Finding matches..."
      },
      { 
        id: "interview", 
        name: "Interview Agent", 
        shortName: "Interview",
        icon: MessageSquare, 
        status: interviewsCount > 0 ? "completed" : "idle",
        progress: interviewsCount > 0 ? 100 : 0,
        message: interviewsCount > 0 ? `${interviewsCount} sessions` : "Ready to practice"
      },
      { 
        id: "progress", 
        name: "Progress Agent", 
        shortName: "Progress",
        icon: BarChart3, 
        status: "running",
        progress: 85,
        message: "Tracking progress..."
      },
    ];

    setAgents(agentStatuses);
  }, [skillsCount, opportunitiesCount, interviewsCount, profileComplete]);

  const getStatusIcon = (status: AgentStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-success" />;
      case "running":
        return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />;
    }
  };

  const getStatusColor = (status: AgentStatus["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success/10 border-success/30";
      case "running":
        return "bg-primary/10 border-primary/30";
      case "error":
        return "bg-destructive/10 border-destructive/30";
      default:
        return "bg-muted border-border";
    }
  };

  const completedCount = agents.filter(a => a.status === "completed").length;
  const totalAgents = agents.length;
  const overallProgress = Math.round((completedCount / totalAgents) * 100);

  return (
    <div className="w-full bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Overall Progress Bar */}
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">AI Agents</span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-primary">{completedCount}/{totalAgents}</span>
        </div>

        {/* Agent Status Pills */}
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                getStatusColor(agent.status)
              )}
            >
              <agent.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{agent.shortName}</span>
              {getStatusIcon(agent.status)}
              {agent.status === "running" && agent.progress !== undefined && (
                <span className="text-xs text-muted-foreground">{agent.progress}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentsStatusBar;
