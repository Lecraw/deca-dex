"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NexMessage {
  id: string;
  text: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "neon" | "outline";
  }>;
}

interface NexAssistantProps {
  messages?: NexMessage[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultOpen?: boolean;
  mood?: "happy" | "thinking" | "excited" | "helpful";
  className?: string;
}

export function NexAssistant({
  messages = [],
  position = "bottom-right",
  defaultOpen = false,
  mood = "happy",
  className
}: NexAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const currentMessage = messages[currentMessageIndex];

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-20 right-4",
    "top-left": "top-20 left-4"
  };

  const handleNextMessage = () => {
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
    }
  };

  const handlePreviousMessage = () => {
    if (currentMessageIndex > 0) {
      setCurrentMessageIndex(currentMessageIndex - 1);
    }
  };

  // Auto-open with first message if not interacted
  useEffect(() => {
    if (!hasInteracted && messages.length > 0 && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, hasInteracted, isOpen]);

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <AnimatePresence>
        {isOpen && currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed w-96 bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl",
              "bottom-20 right-6 max-h-[600px] flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-gray-800">
                  <span className="text-xs font-bold text-white/80">NA</span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Nex Assistant</span>
                  <span className="text-xs text-muted-foreground block">AI Helper</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => {
                  setIsOpen(false);
                  setHasInteracted(true);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Message */}
            <div className="text-sm text-foreground/90 mb-3">
              {currentMessage.text}
            </div>

            {/* Actions */}
            {currentMessage.actions && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentMessage.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || "outline"}
                    className="text-xs h-7"
                    onClick={() => {
                      action.onClick();
                      setHasInteracted(true);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Navigation */}
            {messages.length > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  onClick={handlePreviousMessage}
                  disabled={currentMessageIndex === 0}
                  className="hover:text-foreground disabled:opacity-30"
                >
                  ← Previous
                </button>
                <span>{currentMessageIndex + 1} of {messages.length}</span>
                <button
                  onClick={handleNextMessage}
                  disabled={currentMessageIndex === messages.length - 1}
                  className="hover:text-foreground disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Robot Icon Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-2xl border border-gray-800 hover:border-gray-700 transition-all z-50"
        onClick={() => {
          setIsOpen(!isOpen);
          setHasInteracted(true);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Bot className="w-6 h-6 text-white" />

        {/* Notification badge */}
        {!hasInteracted && messages.length > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          >
            <motion.div
              className="absolute inset-0 bg-blue-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}

// Floating mini message for quick tips
export function NexTip({
  message,
  onClose,
  position = "top-center"
}: {
  message: string;
  onClose?: () => void;
  position?: "top-center" | "bottom-center";
}) {
  const positionClasses = {
    "top-center": "top-20 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-20 left-1/2 -translate-x-1/2"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: position === "top-center" ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === "top-center" ? -10 : 10 }}
      className={cn("fixed z-50", positionClasses[position])}
    >
      <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-full px-4 py-2 shadow-lg">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 hover:bg-primary/10 rounded-full p-1"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}