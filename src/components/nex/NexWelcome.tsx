"use client";

import { motion } from "framer-motion";
import { FloatingCard } from "@/components/ui/floating-card";

interface NexWelcomeProps {
  userName?: string;
  projectCount: number;
  currentStreak: number;
}

export function NexWelcome({ userName }: NexWelcomeProps) {
  const firstName = userName?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <FloatingCard className="relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />

      <motion.h2
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold relative z-10"
      >
        {getGreeting()}, {firstName}!
      </motion.h2>
    </FloatingCard>
  );
}