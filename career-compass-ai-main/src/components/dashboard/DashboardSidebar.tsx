import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Rocket,
  LayoutDashboard,
  Map,
  Briefcase,
  MessageSquare,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<{ full_name: string | null; target_role: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, target_role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Map, label: "Skill Roadmap", path: "/roadmap" },
    { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
    { icon: MessageSquare, label: "Mock Interview", path: "/interview" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-sidebar-primary" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">CareerPilot AI</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="mb-2 px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
            Menu
          </span>
        </div>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                    isActive
                      ? "bg-sidebar-primary/15 text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-sidebar-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Settings Section */}
        <div className="mt-6 mb-2 px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
            Account
          </span>
        </div>
        <ul className="space-y-0.5">
          <li>
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                location.pathname === "/settings"
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className={cn(
                "h-[18px] w-[18px] transition-colors",
                location.pathname === "/settings" ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
              )} />
              <span className="text-sm font-medium">Settings</span>
              {location.pathname === "/settings" && (
                <ChevronRight className="ml-auto h-4 w-4 text-sidebar-primary" />
              )}
            </Link>
          </li>
          <li>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group"
            >
              <LogOut className="h-[18px] w-[18px] text-sidebar-muted group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* User Info & Theme Toggle */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
        >
          <span className="text-sm font-medium text-sidebar-foreground/70">Theme</span>
          <div className="flex items-center gap-2">
            <Sun className={cn(
              "h-4 w-4 transition-all",
              theme === "light" ? "text-sidebar-primary" : "text-sidebar-muted"
            )} />
            <div className={cn(
              "w-8 h-4 rounded-full relative transition-colors",
              theme === "dark" ? "bg-sidebar-primary" : "bg-sidebar-muted/30"
            )}>
              <div className={cn(
                "absolute top-0.5 h-3 w-3 rounded-full bg-sidebar-foreground transition-all",
                theme === "dark" ? "left-4" : "left-0.5"
              )} />
            </div>
            <Moon className={cn(
              "h-4 w-4 transition-all",
              theme === "dark" ? "text-sidebar-primary" : "text-sidebar-muted"
            )} />
          </div>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-sidebar-primary">
              {getInitials(profile?.full_name)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-sidebar-foreground truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-sidebar-muted truncate">
              {profile?.target_role || "Career Explorer"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
