import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outlined" | "glass" | "interactive";
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => {
  const variants = {
    default: "bg-card border border-border shadow-card",
    elevated: "bg-card border border-border shadow-card-hover",
    outlined: "bg-transparent border border-border",
    glass: "bg-card/80 backdrop-blur-xl border border-border/50 shadow-card",
    interactive: "bg-card border border-border shadow-card cursor-pointer",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl text-card-foreground transition-all duration-300 ease-out",
        variants[variant],
        hover && "hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20",
        variant === "interactive" && "hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30 active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
