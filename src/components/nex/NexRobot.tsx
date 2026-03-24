"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NexRobotProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
  mood?: "happy" | "thinking" | "excited" | "helpful";
  isOpen?: boolean;
}

export function NexRobot({
  size = "lg",
  animate = true,
  className,
  mood = "happy",
  isOpen = false
}: NexRobotProps) {
  const sizeMap = {
    sm: 240,
    md: 320,
    lg: 400,
    xl: 480
  };

  const width = sizeMap[size];

  return (
    <motion.div
      className={cn("fixed bottom-0 right-4", className)}
      style={{
        width: `${width}px`,
        height: `${width * 1.5}px`, // Taller aspect ratio
        marginBottom: `-${width * 0.6}px` // Hide bottom 60% of robot
      }}
      initial={{ opacity: 0 }}
      animate={{
        y: isOpen ? -40 : 0,
        opacity: 1
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        opacity: { duration: 0.5 }
      }}
    >
      {/* White glow effect behind robot */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center,
              rgba(255,255,255,0.3) 0%,
              rgba(255,255,255,0.15) 30%,
              rgba(255,255,255,0.05) 60%,
              transparent 100%
            )
          `,
          filter: "blur(60px)",
          transform: "scale(1.5)",
        }}
      />

      {/* Robot Image */}
      <motion.div
        className="relative w-full h-full"
        animate={animate ? {
          rotate: [-0.5, 0.5, -0.5],
        } : undefined}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <img
          src="/humanoid-nex.png"
          alt="Nex AI Assistant"
          width={width}
          height={width * 1.5}
          className="object-contain w-full h-full object-top"
          style={{
            filter: "drop-shadow(0 0 40px rgba(255,255,255,0.2)) drop-shadow(0 30px 60px rgba(0,0,0,0.4))"
          }}
        />

        {/* Subtle eye glow based on mood */}
        {mood !== "happy" && (
          <motion.div
            className="absolute top-[30%] left-[50%] -translate-x-1/2 w-full"
            animate={{
              opacity: mood === "thinking" ? [0, 0.3, 0] :
                      mood === "excited" ? [0.2, 0.5, 0.2] :
                      [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity
            }}
          >
            <div className="flex justify-center gap-12">
              <div className="w-2 h-2 bg-white rounded-full blur-sm" />
              <div className="w-2 h-2 bg-white rounded-full blur-sm" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}