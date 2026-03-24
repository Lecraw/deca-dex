"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NexAvatar } from "./NexAvatar";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NexHelpProps {
  title: string;
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

export function NexHelp({
  title,
  content,
  position = "top",
  className,
  children
}: NexHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label="Help"
      >
        {children || <HelpCircle className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className={cn(
                "absolute z-50 w-64 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-4",
                positionClasses[position]
              )}
            >
              <div className="flex items-start gap-3 mb-2">
                <NexAvatar size="sm" mood="helpful" animate={false} />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{title}</h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-accent rounded-md p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground pl-11">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NexInlineHintProps {
  children: React.ReactNode;
  className?: string;
}

export function NexInlineHint({ children, className }: NexInlineHintProps) {
  return (
    <div className={cn(
      "flex items-start gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg",
      className
    )}>
      <NexAvatar size="sm" mood="helpful" animate={false} />
      <div className="text-xs text-muted-foreground flex-1">
        <span className="font-semibold text-foreground">Nex says: </span>
        {children}
      </div>
    </div>
  );
}

interface NexPromptProps {
  prompt: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  onDismiss?: () => void;
  className?: string;
}

export function NexPrompt({
  prompt,
  actions,
  onDismiss,
  className
}: NexPromptProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg",
        className
      )}>
      <NexAvatar size="sm" mood="excited" />
      <div className="flex-1">
        <p className="text-sm">{prompt}</p>
        {actions && (
          <div className="flex gap-2 mt-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="text-xs text-primary hover:underline"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="hover:bg-accent rounded-md p-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}