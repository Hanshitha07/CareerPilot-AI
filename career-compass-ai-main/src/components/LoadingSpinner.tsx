import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = "md", text, className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 animate-fade-in", className)}>
      <div className="relative">
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
        <div className={cn(
          sizeClasses[size],
          "absolute inset-0 rounded-full bg-primary/10 animate-ping"
        )} style={{ animationDuration: '1.5s' }} />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse-soft">{text}</p>
      )}
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
};

export const CardLoader = () => {
  return (
    <div className="h-full min-h-[200px] flex items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton = ({ className, variant = "rectangular" }: SkeletonProps) => {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "bg-muted shimmer",
        variantClasses[variant],
        className
      )}
    />
  );
};

// Card skeleton for loading states
export const CardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};
