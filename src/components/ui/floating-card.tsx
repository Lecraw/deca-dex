import { cn } from "@/lib/utils";
import React from "react";

interface FloatingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "ghost" | "gradient";
  hover?: boolean;
}

export const FloatingCard = React.forwardRef<HTMLDivElement, FloatingCardProps>(
  ({ className, variant = "default", hover = true, children, ...props }, ref) => {
    const variants = {
      default: "backdrop-blur-2xl bg-background/80 dark:bg-background/60 border border-border/50",
      ghost: "backdrop-blur-sm bg-background/40 dark:bg-background/30 border border-border/30",
      gradient: "backdrop-blur-2xl bg-gradient-to-br from-background/80 via-background/60 to-background/40 border border-border/50",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300",
          variants[variant],
          hover && "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:border-border/70",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FloatingCard.displayName = "FloatingCard";