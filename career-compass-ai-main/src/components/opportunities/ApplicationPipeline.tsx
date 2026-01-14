import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";

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
}

interface ApplicationPipelineProps {
  opportunities: Opportunity[];
  onStatusChange: (id: string, newStatus: string) => void;
}

const statusColumns = [
  { key: "saved", label: "Saved", color: "bg-secondary" },
  { key: "applied", label: "Applied", color: "bg-primary/20" },
  { key: "interviewing", label: "Interviewing", color: "bg-warning/20" },
  { key: "offered", label: "Offered", color: "bg-success/20" },
  { key: "rejected", label: "Rejected", color: "bg-destructive/20" },
  { key: "accepted", label: "Accepted", color: "bg-success/30" },
];

export const ApplicationPipeline = ({ opportunities, onStatusChange }: ApplicationPipelineProps) => {
  const getOpportunitiesByStatus = (status: string) => 
    opportunities.filter(o => o.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("opportunityId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const opportunityId = e.dataTransfer.getData("opportunityId");
    if (opportunityId) {
      onStatusChange(opportunityId, status);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {statusColumns.map((column) => {
          const columnOpportunities = getOpportunitiesByStatus(column.key);
          return (
            <div 
              key={column.key}
              className="w-72 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <Card className={`${column.color} border-0`}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{column.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {columnOpportunities.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 min-h-[200px] space-y-2">
                  {columnOpportunities.map((opportunity) => (
                    <Link 
                      key={opportunity.id} 
                      to={`/opportunities/${opportunity.id}`}
                      className="block"
                    >
                      <Card 
                        className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all bg-background"
                        draggable
                        onDragStart={(e) => handleDragStart(e, opportunity.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{opportunity.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 truncate">
                                  <Building2 className="h-3 w-3" />
                                  {opportunity.company}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3" />
                                  {opportunity.location || "Remote"}
                                </span>
                              </div>
                              <Badge 
                                variant={opportunity.fit_score >= 90 ? "success" : opportunity.fit_score >= 80 ? "default" : "secondary"}
                                className="mt-2 text-xs"
                              >
                                {opportunity.fit_score}% match
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {columnOpportunities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Drag jobs here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
