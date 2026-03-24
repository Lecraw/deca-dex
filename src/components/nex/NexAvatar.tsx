"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NexAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
  mood?: "happy" | "thinking" | "excited" | "helpful";
}

export function NexAvatar({
  size = "md",
  animate = true,
  className,
  mood = "happy"
}: NexAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const moodColors = {
    happy: "from-blue-400 to-indigo-500",
    thinking: "from-purple-400 to-violet-500",
    excited: "from-cyan-400 to-blue-500",
    helpful: "from-green-400 to-emerald-500"
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-full bg-gradient-to-br shadow-lg shadow-primary/20",
        sizeClasses[size],
        moodColors[mood],
        className
      )}
      animate={animate ? {
        y: [0, -4, 0],
      } : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Robot Face */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-[70%] h-[70%]"
          fill="none"
        >
          {/* Eyes */}
          <motion.circle
            cx="35"
            cy="40"
            r="8"
            fill="white"
            animate={animate ? {
              scaleY: [1, 0.1, 1],
            } : undefined}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx="65"
            cy="40"
            r="8"
            fill="white"
            animate={animate ? {
              scaleY: [1, 0.1, 1],
            } : undefined}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />

          {/* Pupils */}
          <circle cx="35" cy="40" r="3" fill="black" />
          <circle cx="65" cy="40" r="3" fill="black" />

          {/* Mouth/Expression based on mood */}
          {mood === "happy" && (
            <path
              d="M 30 60 Q 50 70 70 60"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}
          {mood === "thinking" && (
            <line
              x1="30"
              y1="65"
              x2="70"
              y2="65"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          {mood === "excited" && (
            <ellipse
              cx="50"
              cy="65"
              rx="15"
              ry="10"
              fill="white"
            />
          )}
          {mood === "helpful" && (
            <path
              d="M 30 60 Q 50 75 70 60"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />

      {/* Pulse animation */}
      {animate && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
}