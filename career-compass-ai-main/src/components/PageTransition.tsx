import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const PageTransition = ({ children, className, delay = 50 }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [location.pathname, delay]);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-4 blur-[2px]",
        className
      )}
    >
      {children}
    </div>
  );
};

// Staggered animation wrapper for lists
interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList = ({ children, className, staggerDelay = 100 }: StaggeredListProps) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    children.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * staggerDelay);
      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [children.length, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-400 ease-out",
            visibleItems.includes(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Fade in on scroll component
interface FadeInOnScrollProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export const FadeInOnScroll = ({ children, className, threshold = 0.1 }: FadeInOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return (
    <div
      ref={setRef}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
};
