"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Presentation,
  FileText,
  BarChart3,
  Trophy,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  Award,
  Target,
} from "lucide-react";
import Image from "next/image";
import { useRef, useEffect, useState, useCallback } from "react";

/* ─── Data ────────────────────────────────────── */

const features = [
  {
    icon: Lightbulb,
    title: "AI Idea Generator",
    description: "Generate creative business ideas tailored to your DECA event with AI-powered brainstorming.",
    accent: "from-blue-500/80 to-indigo-600/80",
  },
  {
    icon: Presentation,
    title: "Pitch Deck Builder",
    description: "Create professional pitch decks with drag-and-drop slides, AI suggestions, and auto-formatting.",
    accent: "from-violet-500/80 to-purple-600/80",
  },
  {
    icon: FileText,
    title: "Report Writer",
    description: "Build structured written reports with section-by-section guidance and AI writing assistance.",
    accent: "from-indigo-500/80 to-blue-600/80",
  },
  {
    icon: BarChart3,
    title: "Judge Simulator",
    description: "Get scored by an AI judge using the official DECA rubric before competition day.",
    accent: "from-sky-500/80 to-blue-600/80",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Checker",
    description: "Automatically verify your project meets all DECA requirements — slide counts, sections, formatting.",
    accent: "from-blue-400/80 to-indigo-500/80",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn XP, unlock badges, and climb the leaderboard as you build your project.",
    accent: "from-purple-500/80 to-violet-600/80",
  },
];

const steps = [
  { num: "01", title: "Pick Your Event", desc: "Select from all DECA competitive events" },
  { num: "02", title: "Generate Ideas", desc: "AI brainstorms business ideas for you" },
  { num: "03", title: "Build Your Project", desc: "Step-by-step guided creation with AI" },
  { num: "04", title: "Present & Win", desc: "Export, practice, and compete" },
];

const impactStats = [
  { value: 12400, suffix: "+", label: "Students Helped", icon: Users, sub: "across 380+ high schools" },
  { value: 87, suffix: "%", label: "Score Improvement", icon: TrendingUp, sub: "on judge rubrics" },
  { value: 2300, suffix: "+", label: "Projects Built", icon: Target, sub: "competition-ready" },
  { value: 340, suffix: "+", label: "Competition Wins", icon: Award, sub: "district to ICDC" },
];

const marqueeItems = [
  "AI-Powered Research",
  "Judge Simulation",
  "Pitch Deck Builder",
  "Real-Time Feedback",
  "50+ DECA Events",
  "Compliance Checking",
  "Report Writing",
  "Roleplay Practice",
  "XP & Leaderboards",
  "Smart Brainstorming",
  "Slide Generation",
  "Competition Ready",
];

/* ─── Hooks ───────────────────────────────────── */

function useScrollReveal() {
  const init = useCallback((root: HTMLElement | null) => {
    if (!root) return;
    const els = root.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return init;
}

/* ─── Components ──────────────────────────────── */

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

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

  return <span ref={ref} className="stat-number tabular-nums">{display.toLocaleString()}{suffix}</span>;
}

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden py-4 border-y border-border/30">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center mx-8 shrink-0 text-[13px] text-muted-foreground/70 uppercase tracking-[0.18em] font-medium">
            <span className="w-[3px] h-[3px] bg-primary/40 rotate-45 mr-5 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            "--duration": `${6 + Math.random() * 10}s`,
            "--delay": `${Math.random() * 8}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

const storyCards = [
  { category: "PERFORMANCE", title: "98% Uptime", desc: "Enterprise-grade reliability ensuring your preparation is never interrupted." },
  { category: "SPEED", title: "1.2s Response", desc: "Lightning-fast AI feedback so you can iterate and improve in real-time." },
  { category: "COMMUNITY", title: "12,400+ Students", desc: "Trusted by DECA competitors across 380+ high schools nationwide." },
  { category: "COVERAGE", title: "50+ Events", desc: "Every DECA competitive event category fully supported and covered." },
  { category: "AI ENGINE", title: "GPT-4o Powered", desc: "The latest AI models delivering competition-winning insights." },
  { category: "SECURITY", title: "256-bit Encryption", desc: "Bank-level data security protecting all your project work and ideas." },
];

function LogoSpinSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const cardCount = storyCards.length;

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const handleScroll = () => {
      const rect = outer.getBoundingClientRect();
      const scrollable = outer.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Per-card visibility: one card at a time, alternating left/right
  const getCardStyle = (index: number) => {
    const segment = 1 / cardCount;
    const cardStart = index * segment;
    const cardEnd = (index + 1) * segment;
    const fadeZone = segment * 0.25;
    const side: "left" | "right" = index % 2 === 0 ? "left" : "right";
    const dir = side === "left" ? -1 : 1;

    let opacity = 0;
    let xOffset = dir * 50;

    if (scrollProgress >= cardStart && scrollProgress < cardEnd) {
      if (scrollProgress < cardStart + fadeZone) {
        // Fading in
        const t = (scrollProgress - cardStart) / fadeZone;
        const eased = 1 - Math.pow(1 - t, 3);
        opacity = eased;
        xOffset = dir * 50 * (1 - eased);
      } else if (scrollProgress > cardEnd - fadeZone) {
        // Fading out
        const t = (cardEnd - scrollProgress) / fadeZone;
        const eased = 1 - Math.pow(1 - t, 3);
        opacity = eased;
        xOffset = dir * 50 * (1 - eased);
      } else {
        // Fully visible
        opacity = 1;
        xOffset = 0;
      }
    }

    return { opacity, xOffset, side };
  };

  const rotY = scrollProgress * 360;

  const logoMaskStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
    WebkitMaskImage: "url(/logo-white.png)",
    maskImage: "url(/logo-white.png)",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return (
    <div ref={outerRef} style={{ height: `${cardCount * 100}vh` }} className="relative">
      {/* Sticky viewport — stays pinned while user scrolls through tall container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-15 dark:opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,oklch(0.42_0.18_255/0.05)_0%,transparent_50%)] pointer-events-none" />

        {/* Vertical center line */}
        <div className="absolute left-1/2 top-[8%] bottom-[8%] w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none" />

        {/* Center logo — stays locked in place */}
        <div className="relative z-10" style={{ perspective: "1000px" }}>
          {/* Orbit rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] border border-primary/8 rounded-full orbit-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] border border-primary/4 rounded-full orbit-ring" style={{ animationDelay: "2s" }} />
          </div>

          {/* Spinning blue logo */}
          <div
            className="w-20 h-20 md:w-28 md:h-28"
            style={{
              transform: `rotateY(${rotY}deg)`,
              transformStyle: "preserve-3d",
              filter: "drop-shadow(0 0 25px oklch(0.50 0.16 255 / 0.35)) drop-shadow(0 0 50px oklch(0.45 0.16 255 / 0.15))",
            }}
          >
            <div className="absolute inset-0" style={{ transform: "translateZ(3px)", backfaceVisibility: "hidden" }}>
              <div className="w-full h-full" style={logoMaskStyle} />
            </div>
            <div className="absolute inset-0" style={{ transform: "translateZ(-3px) rotateY(180deg)", backfaceVisibility: "hidden" }}>
              <div className="w-full h-full opacity-75" style={logoMaskStyle} />
            </div>
          </div>

          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 bg-[radial-gradient(circle,oklch(0.40_0.16_255/0.10)_0%,transparent_60%)] pointer-events-none blur-sm" />
        </div>

        {/* Cards — one at a time, alternating sides */}
        {storyCards.map((card, i) => {
          const { opacity, xOffset, side } = getCardStyle(i);
          return (
            <div
              key={card.category}
              className={`absolute top-1/2 ${side === "left" ? "left-[4%] md:left-[8%]" : "right-[4%] md:right-[8%]"}`}
              style={{
                opacity,
                transform: `translateX(${xOffset}px) translateY(-50%)`,
                transition: "none",
                pointerEvents: opacity > 0.5 ? "auto" : "none",
              }}
            >
              <div className={`w-64 md:w-80 p-6 md:p-8 bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl shadow-lg ${side === "right" ? "text-right" : ""}`}>
                <span className="text-primary text-[11px] font-mono uppercase tracking-[0.18em]">
                  {String(i + 1).padStart(2, "0")} / {card.category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold mt-3 tracking-tight">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{card.desc}</p>
                {/* Progress dots */}
                <div className={`flex gap-1.5 mt-5 ${side === "right" ? "justify-end" : ""}`}>
                  {storyCards.map((_, di) => (
                    <div
                      key={di}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        di === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Corner labels */}
        <div className="absolute top-6 left-6 md:left-10">
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Scroll to explore</span>
        </div>
        <div className="absolute top-6 right-6 md:right-10">
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Nexari / Platform</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────── */

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const initReveal = useScrollReveal();

  useEffect(() => {
    const cleanup = initReveal(rootRef.current);
    return cleanup;
  }, [initReveal]);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ─── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/50 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:hidden block" />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "#impact", label: "Impact" },
              { href: "/events", label: "Events" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors relative group py-1"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[13px] h-8" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="h-8 text-[13px]" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero ───────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Ambient layers */}
          <div className="absolute inset-0 hero-mesh" />
          <div className="absolute inset-0 grid-bg opacity-40 dark:opacity-70" />
          <Particles />

          {/* Scan line effect */}
          <div className="absolute inset-0 scan-line overflow-hidden pointer-events-none" />

          {/* Radial glow */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,oklch(0.42_0.18_255/0.15)_0%,transparent_65%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 text-[11px] uppercase tracking-[0.2em] text-primary/80 border border-primary/15 bg-primary/5 font-medium">
              <Zap className="h-3 w-3" />
              AI-Powered DECA Preparation
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-[-0.04em] leading-[1.05] max-w-5xl mx-auto">
              Your Gateway to{" "}
              <span className="text-primary text-glow">Winning</span>{" "}
              at DECA
            </h1>

            {/* Subheading */}
            <p className="text-[15px] md:text-base text-muted-foreground max-w-lg mx-auto mt-8 leading-relaxed">
              From idea to competition-ready pitch deck. AI mentoring, judge simulation, and compliance checking — all in one platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
              <Button size="lg" className="group h-11 px-7" asChild>
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="neon" className="h-11 px-7" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>

            {/* Scroll cue */}
            <div className="mt-24 flex flex-col items-center gap-2 text-muted-foreground/40">
              <span className="text-[9px] uppercase tracking-[0.25em] font-medium">Scroll</span>
              <div className="relative w-px h-10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent" />
                <div className="absolute top-0 w-px h-3 bg-primary/60 animate-bounce" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Marquee ───────────────────────── */}
        <Marquee />

        {/* ─── Quick Stats ───────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="reveal-stagger grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16">
            {[
              { value: "50+", label: "DECA Events" },
              { value: "AI", label: "Powered Feedback" },
              { value: "24/7", label: "Practice Anytime" },
              { value: "Free", label: "To Get Started" },
            ].map((stat) => (
              <div key={stat.label} className="reveal text-center">
                <div className="text-3xl md:text-4xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-2 uppercase tracking-[0.18em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="gradient-line" />

        {/* ─── Features ──────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="reveal mb-16 max-w-2xl">
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">// Features</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-3">Everything You Need</h2>
            <p className="text-muted-foreground mt-4 text-[15px]">One platform for every step of your DECA journey.</p>
          </div>

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/30">
            {features.map((f) => (
              <div key={f.title} className="reveal group relative bg-background p-8 hover:bg-accent/20 transition-all duration-500 cursor-default h-full">
                {/* Top scan line */}
                <div className={`absolute top-0 left-0 w-0 h-px bg-gradient-to-r ${f.accent} group-hover:w-full transition-all duration-700 ease-out`} />

                <div className={`inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br ${f.accent} mb-5`}>
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>

                {/* Corner brackets on hover */}
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
              </div>
            ))}
          </div>
        </section>

        <div className="gradient-line" />

        {/* ─── How It Works ──────────────────── */}
        <section id="how-it-works" className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20 dark:opacity-40" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="reveal mb-16 max-w-2xl">
              <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">// Process</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-3">How It Works</h2>
              <p className="text-muted-foreground mt-4 text-[15px]">Go from zero to competition-ready in four steps.</p>
            </div>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-6 left-[6%] right-[6%] h-px bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10" />

              <div className="reveal-stagger grid grid-cols-1 md:grid-cols-4 gap-8">
                {steps.map((s, i) => (
                  <div key={s.num} className="reveal group text-center md:text-left relative">
                    {/* Step indicator */}
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-5 border border-primary/20 bg-background relative group-hover:border-primary/40 transition-colors">
                      <span className="text-base font-mono font-bold text-primary">{s.num}</span>
                      <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-primary/40" />
                      <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-primary/40" />
                    </div>

                    <h3 className="font-semibold text-[15px] mb-1.5">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

                    {i < 3 && (
                      <div className="hidden md:block absolute top-6 -right-4 text-primary/25">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Sticky Logo Story ────────────── */}
        <LogoSpinSection />

        <div className="gradient-line" />

        {/* ─── Impact Stats ──────────────────── */}
        <section id="impact" className="relative py-28 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,oklch(0.42_0.18_255/0.06)_0%,transparent_55%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="reveal text-center mb-16">
              <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">// Impact</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-3">
                Trusted by DECA Students Everywhere
              </h2>
              <p className="text-muted-foreground mt-4 text-[15px] max-w-md mx-auto">
                Real results from students who used Nexari to prepare for competition.
              </p>
            </div>

            <div className="reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5">
              {impactStats.map((stat) => (
                <div key={stat.label} className="reveal group relative p-7 text-center border border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/15 transition-all duration-500">
                  {/* Top line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <stat.icon className="h-5 w-5 text-primary/60 mx-auto mb-3" />

                  <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm font-medium mb-0.5">{stat.label}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.sub}</div>

                  {/* Corner brackets */}
                  <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="reveal mt-14 text-center">
              <blockquote className="text-muted-foreground italic max-w-lg mx-auto text-[15px] leading-relaxed">
                &ldquo;Nexari helped me go from not knowing where to start to winning 1st place at States in my first year competing.&rdquo;
              </blockquote>
              <cite className="mt-3 block text-[11px] text-muted-foreground/60 not-italic uppercase tracking-wider">
                DECA Chapter President, California
              </cite>
            </div>
          </div>
        </section>

        {/* ─── Marquee 2 ─────────────────────── */}
        <Marquee />

        {/* ─── CTA ───────────────────────────── */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,oklch(0.42_0.18_255/0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-15 dark:opacity-30" />

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <div className="reveal">
              <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">// Get Started</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-4">
                Ready to Win at DECA?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto text-[15px]">
                Join students across the country using AI to build better projects faster.
              </p>
              <Button size="lg" className="mt-8 group h-11 px-8" asChild>
                <Link href="/login">
                  Get Started Free
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-white.png" alt="Nexari" width={18} height={18} className="w-[18px] h-[18px] dark:block hidden opacity-30" />
            <Image src="/logo.png" alt="Nexari" width={18} height={18} className="w-[18px] h-[18px] dark:hidden block opacity-30" />
            <span className="text-[11px] text-muted-foreground/60">Nexari</span>
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Nexari is not affiliated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
