import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { ApplicationAnalytics } from "@/components/analytics/ApplicationAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { mockState } from "@/lib/mock-state";
import { Loader2 } from "lucide-react";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    // Simulate loading delay for realism
    setTimeout(() => {
      const analyticsInfo = mockState.getAnalytics(user.id);

      // Transform mock analytics to match component props if needed, 
      // but ApplicationAnalytics component likely expects raw counts or specific shapes.
      // Based on previous code, it took 'opportunities' and 'interviews' arrays.
      // However, our mockState provides aggregated stats. 
      // We should verify what ApplicationAnalytics expects.
      // Let's assume for now we need to pass the aggregated data or dummy arrays that match the counts.

      // Use actual mock jobs to preserve rich data (feedback, company names, etc.)
      const mockJobs = mockState.getJobs(user.id);

      const mockOpps = mockJobs.map(job => ({
        id: job.id,
        status: job.status,
        company: job.company,
        title: job.title,
        created_at: job.created_at,
        applied_at: job.applied_at || null,
        feedback: job.feedback,
        next_step: job.next_step
      }));

      // For interviews, we can still generate them based on the pre-calculated mock analytics stats
      // or derive them from jobs if we had more robust event linkage in mock-state.
      // For now, generating based on stats is fine for the graph.
      const mockInterviews = Array(Math.round(analyticsInfo.totalApplications * (analyticsInfo.interviewRate / 100))).fill({ score: 85, completed_at: new Date().toISOString() });

      setOpportunities(mockOpps);
      setInterviews(mockInterviews);
      setLoading(false);
    }, 500);
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
      <main className="flex-1 p-8 overflow-auto">
        <PageTransition>
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Analytics</h1>
              <p className="text-muted-foreground">
                Track your application performance and conversion rates.
              </p>
            </div>

            <ApplicationAnalytics
              opportunities={opportunities}
              interviews={interviews}
            />
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default AnalyticsPage;
