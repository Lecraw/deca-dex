"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ImpactCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: LucideIcon;
  sub: string;
}

export const ImpactCard = ({
  value,
  suffix = "",
  label,
  icon: Icon,
  sub
}: ImpactCardProps) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let str = generateRandomString(800);
    setRandomString(str);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done) {
          setDone(true);
          const dur = 1800;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 4);
            setDisplay(Math.round(eased * value));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, done]);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(800);
    setRandomString(str);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className="reveal group relative p-7 text-center border border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/15 transition-all duration-500 overflow-hidden"
    >
      {/* Evervault Pattern Effect */}
      <CardPattern
        mouseX={mouseX}
        mouseY={mouseY}
        randomString={randomString}
      />

      {/* Top line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <Icon className="h-5 w-5 text-primary/60 mx-auto mb-3" />

        <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
          <span className="stat-number tabular-nums">{display.toLocaleString()}{suffix}</span>
        </div>
        <div className="text-sm font-medium mb-0.5">{label}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString }: {
  mouseX: any;
  mouseY: any;
  randomString: string;
}) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 opacity-0 mix-blend-overlay group-hover:opacity-[0.08]"
        style={style}
      >
        <p className="absolute inset-x-0 text-[9px] h-full break-words whitespace-pre-wrap text-primary/20 font-mono font-medium transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "0123456789+-%*=<>(){}[]";

export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};