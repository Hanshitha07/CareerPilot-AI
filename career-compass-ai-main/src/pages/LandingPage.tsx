import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain,
  Target,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Rocket,
  ChevronRight,
  Sparkles,
  Users,
  BarChart3
} from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    { icon: Brain, title: "Profile Understanding", description: "AI analyzes your resume, skills, and career aspirations." },
    { icon: Target, title: "Job Market Reasoning", description: "Intelligent matching against real job requirements." },
    { icon: TrendingUp, title: "Skill Gap Analysis", description: "Dynamic roadmaps that adapt based on your progress." },
    { icon: Briefcase, title: "Opportunity Scouting", description: "Proactive alerts for jobs and hackathons." },
    { icon: GraduationCap, title: "Mock Interviews", description: "AI-driven practice sessions with feedback." },
    { icon: BarChart3, title: "Progress Tracking", description: "Visual dashboards showing your growth." },
  ];



  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/50 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareerPilot AI</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard"><Button variant="hero">Go to Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/auth"><Button variant="ghost">Sign In</Button></Link>
                <Link to="/auth"><Button variant="hero">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-6 max-w-4xl text-center animate-fade-in">

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your AI Career<span className="gradient-text block">Development Partner</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A multi-agent AI system that thinks, plans, acts, and learns to accelerate your career journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="hero" size="xl">
                {user ? "Go to Dashboard" : "Start Your Journey"}
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="glass" size="xl">Watch Demo</Button>
          </div>

        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Autonomous Career Intelligence</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Multi-agent system continuously optimizing your career path.</p>
        </div>
        <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border p-12 md:p-16 text-center overflow-hidden">
            <Users className="h-12 w-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Career?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">Join thousands accelerating their careers with AI.</p>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="hero" size="xl">
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">CareerPilot AI</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 CareerPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
