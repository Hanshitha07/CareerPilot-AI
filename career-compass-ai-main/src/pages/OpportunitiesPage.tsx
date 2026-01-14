import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithFallback } from "@/lib/api-fallbacks";
import { mockState } from "@/lib/mock-state";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Clock, ChevronRight, Loader2, Check, Bookmark, Search, Filter, X, LayoutGrid, List, Briefcase } from "lucide-react";
import { ApplicationPipeline } from "@/components/opportunities/ApplicationPipeline";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string | null;
  fit_score: number;
  type: string | null;
  status: string;
  description: string | null;
  created_at: string;
  deadline?: string | null;
  salary_range?: string | null;
  applied_at?: string | null;
}

const jobTypes = [
  { value: "all", label: "All Types" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Remote", label: "Remote" },
  { value: "Internship", label: "Internship" },
];

const salaryRanges = [
  { value: "all", label: "Any Salary" },
  { value: "0-50000", label: "$0 - $50,000" },
  { value: "50000-80000", label: "$50,000 - $80,000" },
  { value: "80000-120000", label: "$80,000 - $120,000" },
  { value: "120000-150000", label: "$120,000 - $150,000" },
  { value: "150000+", label: "$150,000+" },
];

const experienceLevels = [
  { value: "all", label: "All Levels" },
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior (1-2 years)" },
  { value: "mid", label: "Mid-Level (3-5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
  { value: "lead", label: "Lead / Manager" },
];

const OpportunitiesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "saved" | "applied">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");

  useEffect(() => {
    if (user) {
      loadOpportunities();
    }
  }, [user]);

  const loadOpportunities = async () => {
    if (!user) return;

    try {
      // First try to load from Supabase
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, company, location, fit_score, type, status, description, created_at, deadline, salary_range")
        .eq("user_id", user.id)
        .order("fit_score", { ascending: false });

      if (error) throw error;

      // Demo Mode Logic: If no user opportunities, load strict mock data
      if (!data || data.length === 0) {
        const mockJobs = mockState.getJobs(user.id);
        // Since the component expects 'Opportunity' type which maps to Supabase rows,
        // we map our MockJob to match it. Only use properties that exist in both.
        const mappedMockJobs: Opportunity[] = mockJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          fit_score: job.fit_score,
          type: job.type,
          status: job.status,
          description: job.description,
          created_at: job.created_at,
          deadline: job.deadline,
          salary_range: job.salary_range,
          applied_at: job.applied_at || null
        }));

        setOpportunities(mappedMockJobs);
      } else {
        setOpportunities(data);
      }
    } catch (error) {
      console.error("Error loading opportunities:", error);
      // Fallback to mock data on error too
      const mockJobs = mockState.getJobs(user.id);
      const mappedMockJobs: Opportunity[] = mockJobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        fit_score: job.fit_score,
        type: job.type,
        status: job.status,
        description: job.description,
        created_at: job.created_at,
        deadline: job.deadline,
        salary_range: job.salary_range,
        applied_at: job.applied_at || null
      }));
      setOpportunities(mappedMockJobs);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveJobs = async () => {
    if (!user) return;

    setSearching(true);
    try {
      const { data, error } = await invokeWithFallback("fetch-jobs", {
        body: {
          query: searchQuery || "Software Developer",
          location: searchLocation || "Remote",
          userId: user.id
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: data.isMock ? "Sample jobs loaded" : "Live jobs fetched!",
          description: data.isMock
            ? "Add RAPIDAPI_KEY for real job listings"
            : `Found ${data.jobs?.length || 0} matching jobs`,
        });
        await loadOpportunities();
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      // Fallback handles the mock data now, so we don't need to show error toast
      // to the user as per requirements.
    } finally {
      setSearching(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const opportunity = opportunities.find(o => o.id === id);
      if (newStatus === 'applied') {
        const updatedJob = mockState.applyToJob(user?.id || '', id);
        if (updatedJob) {
          // Update local state to reflect the change immediately
          setOpportunities(opportunities.map(o => o.id === id ? { ...o, status: 'applied' } : o));

          toast({
            title: "Application Submitted",
            description: "Good luck! We've added this to your calendar.",
          });
          return;
        }
      }

      const { error } = await supabase
        .from("opportunities")
        .update({
          status: newStatus as any,
          applied_at: newStatus === "applied" && !opportunity?.applied_at ? new Date().toISOString() : opportunity?.applied_at
        })
        .eq("id", id);

      if (error) throw error;

      setOpportunities(opportunities.map(o =>
        o.id === id ? { ...o, status: newStatus } : o
      ));

      await supabase.from("career_memory").insert({
        user_id: user?.id,
        memory_type: `status_changed_${newStatus}`,
        content: {
          opportunityId: id,
          previousStatus: opportunity?.status,
          newStatus: newStatus,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: "Status updated!",
        description: `Application moved to "${newStatus}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const parseSalary = (salaryStr: string | null): number => {
    if (!salaryStr) return 0;
    const match = salaryStr.match(/\$?([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""));
    }
    return 0;
  };

  const matchesSalaryFilter = (salary: string | null): boolean => {
    if (salaryFilter === "all") return true;
    const salaryValue = parseSalary(salary);

    switch (salaryFilter) {
      case "0-50000":
        return salaryValue >= 0 && salaryValue < 50000;
      case "50000-80000":
        return salaryValue >= 50000 && salaryValue < 80000;
      case "80000-120000":
        return salaryValue >= 80000 && salaryValue < 120000;
      case "120000-150000":
        return salaryValue >= 120000 && salaryValue < 150000;
      case "150000+":
        return salaryValue >= 150000;
      default:
        return true;
    }
  };

  const matchesExperienceFilter = (title: string, description: string | null): boolean => {
    if (experienceFilter === "all") return true;

    const text = `${title} ${description || ""}`.toLowerCase();

    switch (experienceFilter) {
      case "entry":
        return text.includes("entry") || text.includes("junior") || text.includes("graduate") || text.includes("intern");
      case "junior":
        return text.includes("junior") || text.includes("1-2 year") || text.includes("associate");
      case "mid":
        return text.includes("mid") || text.includes("3-5 year") || text.includes("intermediate");
      case "senior":
        return text.includes("senior") || text.includes("5+ year") || text.includes("experienced");
      case "lead":
        return text.includes("lead") || text.includes("manager") || text.includes("principal") || text.includes("staff");
      default:
        return true;
    }
  };

  const filteredOpportunities = opportunities.filter(o => {
    // Status filter
    if (statusFilter !== "all" && o.status !== statusFilter) return false;

    // Job type filter
    if (jobTypeFilter !== "all" && o.type !== jobTypeFilter) return false;

    // Salary filter
    if (!matchesSalaryFilter(o.salary_range || null)) return false;

    // Experience filter
    if (!matchesExperienceFilter(o.title, o.description)) return false;

    return true;
  });

  const activeFiltersCount = [jobTypeFilter, salaryFilter, experienceFilter].filter(f => f !== "all").length;

  const clearAllFilters = () => {
    setJobTypeFilter("all");
    setSalaryFilter("all");
    setExperienceFilter("all");
    setStatusFilter("all");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  };

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
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-1">Opportunities</h1>
            <p className="text-muted-foreground text-sm">Discover jobs matched to your profile</p>
          </div>

          {/* Job Search Section */}
          <Card className="mb-5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Job title or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={fetchLiveJobs}
                  disabled={searching}
                  className="min-w-[120px]"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            <div className="flex gap-1">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs"
              >
                All ({opportunities.length})
              </Button>
              <Button
                variant={statusFilter === "saved" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("saved")}
                className="text-xs"
              >
                Saved ({opportunities.filter(o => o.status === "saved").length})
              </Button>
              <Button
                variant={statusFilter === "applied" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("applied")}
                className="text-xs"
              >
                Applied ({opportunities.filter(o => o.status === "applied").length})
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground text-xs gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex gap-0.5 ml-auto border rounded-lg p-0.5 bg-secondary/50">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 w-7 p-0"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "pipeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("pipeline")}
                className="h-7 w-7 p-0"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="mb-5">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Job Type</label>
                    <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Salary Range</label>
                    <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {salaryRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Experience Level</label>
                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
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
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          <div className="mb-4 text-xs text-muted-foreground">
            {filteredOpportunities.length} of {opportunities.length} opportunities
          </div>

          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">No opportunities yet</p>
                <p className="text-sm text-muted-foreground">Search for jobs above to get started</p>
              </CardContent>
            </Card>
          ) : viewMode === "pipeline" ? (
            <ApplicationPipeline
              opportunities={filteredOpportunities}
              onStatusChange={updateStatus}
            />
          ) : filteredOpportunities.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-3">No opportunities match your filters</p>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOpportunities.map((o) => (
                <Link to={`/opportunities/${o.id}`} key={o.id} className="block group">
                  <Card className="hover:shadow-card-hover hover:border-primary/20 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{o.title}</p>
                            <div className="flex items-center gap-3 text-muted-foreground text-sm mt-0.5">
                              <span className="truncate">{o.company}</span>
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <MapPin className="h-3 w-3" />
                                {o.location || "Remote"}
                              </span>
                              <span className="flex items-center gap-1 flex-shrink-0 text-xs">
                                <Clock className="h-3 w-3" />
                                {formatDate(o.created_at)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {o.type && <Badge variant="secondary" className="text-xs font-normal">{o.type}</Badge>}
                              {o.salary_range && <Badge variant="secondary" className="text-xs font-normal">{o.salary_range}</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge
                            variant={o.fit_score >= 90 ? "default" : "secondary"}
                            className={o.fit_score >= 90 ? "bg-primary/10 text-primary border-0" : ""}
                          >
                            {o.fit_score}% match
                          </Badge>
                          <div className="flex gap-1.5 mt-1">
                            {o.status !== "applied" && o.status !== "interviewing" && o.status !== "offered" && o.status !== "accepted" && (
                              <>
                                {o.status !== "saved" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      updateStatus(o.id, "saved");
                                    }}
                                  >
                                    <Bookmark className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="h-7"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateStatus(o.id, "applied");
                                  }}
                                >
                                  Apply
                                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                                </Button>
                              </>
                            )}
                            {(o.status === "applied" || o.status === "interviewing" || o.status === "offered" || o.status === "accepted") && (
                              <Badge className="bg-primary/10 text-primary border-0 gap-1 capitalize text-xs">
                                <Check className="h-3 w-3" />
                                {o.status}
                              </Badge>
                            )}
                            {o.status === "rejected" && (
                              <Badge variant="destructive" className="gap-1 capitalize text-xs">
                                {o.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OpportunitiesPage;
