"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  index: number;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  accent,
  index
}: FeatureCardProps) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className="reveal group relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-500 overflow-hidden cursor-default shadow-sm hover:shadow-xl"
    >
      {/* Evervault Pattern Effect */}
      <CardPattern
        mouseX={mouseX}
        mouseY={mouseY}
        randomString={randomString}
        accent={accent}
      />

      {/* Original card content */}
      <div className="relative z-10 p-8">
        {/* Graphical Watermark Icon */}
        <Icon className="absolute -bottom-8 -right-8 w-40 h-40 text-foreground opacity-[0.03] group-hover:opacity-[0.08] group-hover:-rotate-12 group-hover:scale-110 transition-all duration-700" />

        {/* Ambient Interior Glow */}
        <div className={`absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br ${accent} opacity-[0.05] group-hover:opacity-[0.15] rounded-full blur-3xl transition-opacity duration-500`} />

        {/* Top Highlight Trace */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/40 transition-colors duration-700" />

        <div className="relative z-20">
          <div className="flex justify-between items-start mb-6">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accent} shadow-inner ring-1 ring-white/20 dark:ring-white/10`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em]">{String(index + 1).padStart(2, '0')}</span>
          </div>

          <h3 className="font-semibold text-[17px] mb-3 tracking-tight group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed drop-shadow-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString, accent }: {
  mouseX: any;
  mouseY: any;
  randomString: string;
  accent: string;
}) {
  let maskImage = useMotionTemplate`radial-gradient(350px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  // Extract colors from the accent gradient string
  const gradientColors = accent.includes("blue")
    ? "from-blue-500/40 to-indigo-700/40"
    : accent.includes("violet")
    ? "from-violet-500/40 to-purple-700/40"
    : accent.includes("indigo")
    ? "from-indigo-500/40 to-blue-700/40"
    : accent.includes("sky")
    ? "from-sky-500/40 to-blue-700/40"
    : accent.includes("purple")
    ? "from-purple-500/40 to-violet-700/40"
    : "from-blue-500/40 to-purple-700/40";

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradientColors} opacity-0 group-hover:opacity-100 transition duration-500`}
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover:opacity-[0.15]"
        style={style}
      >
        <p className="absolute inset-x-0 text-[10px] h-full break-words whitespace-pre-wrap text-primary/30 dark:text-primary/20 font-mono font-medium transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789</>{}[]()=+-*&%$#@!~";

export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};