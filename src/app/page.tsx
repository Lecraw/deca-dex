"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
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
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { FeatureCard } from "@/components/ui/feature-card";
import { ImpactCard } from "@/components/ui/impact-card";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

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
  { category: "COVERAGE", title: "50+ Events", desc: "Every DECA competitive event category fully supported and covered." },
  { category: "AI ENGINE", title: "Claude AI Powered", desc: "Anthropic's most capable AI model delivering competition-winning insights." },
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
      const raw = -rect.top / scrollable;
      setScrollProgress(Math.max(0, Math.min(1, raw)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Card visibility ──
     scrollProgress [0,1] → pos [0, cardCount-1]
     Each card is "active" when pos ≈ its index.
     Opacity = smoothstep(1 - |pos - index|), zero when |diff| ≥ 1.
     Cards on alternating sides so overlapping crossfades look great. */
  const getCardStyle = (index: number) => {
    const side: "left" | "right" = index % 2 === 0 ? "left" : "right";

    const pos = scrollProgress * (cardCount - 1); // 0 → 5
    const diff = pos - index;
    const absDiff = Math.abs(diff);

    let opacity = 0;
    let translateX = side === "left" ? -60 : 60;

    if (absDiff < 1) {
      const t = 1 - absDiff;
      opacity = t * t * (3 - 2 * t); // smoothstep ease
      translateX = (side === "left" ? -60 : 60) * (1 - opacity);
    }

    return { opacity, translateX, side };
  };

  const rotY = scrollProgress * 720;

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
    <div ref={outerRef} style={{ height: "450vh" }} className="relative">
      {/* Sticky viewport — pinned while user scrolls through 450vh container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-15 dark:opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,oklch(0.42_0.18_255/0.05)_0%,transparent_50%)] pointer-events-none" />

        {/* Vertical center line */}
        <div className="absolute left-1/2 top-[8%] bottom-[8%] w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none" />

        {/* Center logo — stays locked in place */}
        <div className="relative z-10" style={{ perspective: "1200px" }}>
          {/* Orbit rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[240px] h-[240px] md:w-[320px] md:h-[320px] lg:w-[360px] lg:h-[360px] border border-primary/8 rounded-full orbit-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[380px] h-[380px] md:w-[500px] md:h-[500px] lg:w-[560px] lg:h-[560px] border border-primary/4 rounded-full orbit-ring" style={{ animationDelay: "2s" }} />
          </div>

          {/* Spinning blue logo */}
          <div
            className="w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48"
            style={{
              transform: `rotateY(${rotY}deg)`,
              transformStyle: "preserve-3d",
              filter: "drop-shadow(0 0 35px oklch(0.50 0.16 255 / 0.4)) drop-shadow(0 0 70px oklch(0.45 0.16 255 / 0.2))",
            }}
          >
            <div className="absolute inset-0" style={{ transform: "translateZ(4px)", backfaceVisibility: "hidden" }}>
              <div className="w-full h-full" style={logoMaskStyle} />
            </div>
            <div className="absolute inset-0" style={{ transform: "translateZ(-4px) rotateY(180deg)", backfaceVisibility: "hidden" }}>
              <div className="w-full h-full opacity-75" style={logoMaskStyle} />
            </div>
          </div>

          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-80 md:h-80 bg-[radial-gradient(circle,oklch(0.40_0.16_255/0.12)_0%,transparent_60%)] pointer-events-none blur-sm" />
        </div>

        {/* Cards — one at a time, alternating sides */}
        {storyCards.map((card, i) => {
          const { opacity, translateX, side } = getCardStyle(i);
          if (opacity <= 0.01) return null; // skip invisible cards for perf
          return (
            <div
              key={card.category}
              className={`absolute ${side === "left" ? "left-[3%] md:left-[5%] lg:left-[7%]" : "right-[3%] md:right-[5%] lg:right-[7%]"}`}
              style={{
                opacity,
                top: "50%",
                transform: `translate(${translateX}px, -50%)`,
                willChange: "transform, opacity",
                pointerEvents: opacity > 0.5 ? "auto" : "none",
              }}
            >
              <div
                className={`w-80 md:w-96 lg:w-[420px] p-8 md:p-10 lg:p-12 rounded-xl border bg-card/90 text-card-foreground border-border/50 backdrop-blur-xl shadow-2xl ${side === "right" ? "text-right" : ""}`}
                style={{
                  boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 ${20 * opacity}px oklch(0.50 0.16 255 / ${0.06 * opacity})`,
                }}
              >
                <span className="text-primary text-[11px] md:text-xs font-mono uppercase tracking-[0.18em]">
                  {String(i + 1).padStart(2, "0")} / {card.category}
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 tracking-tight">{card.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground mt-2 md:mt-3 leading-relaxed">{card.desc}</p>
                {/* Progress dots */}
                <div className={`flex gap-2 mt-6 md:mt-8 ${side === "right" ? "justify-end" : ""}`}>
                  {storyCards.map((_, di) => (
                    <div
                      key={di}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        di === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Scroll progress indicator */}
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {storyCards.map((_, i) => {
            const pos = scrollProgress * (cardCount - 1);
            const isActive = Math.abs(pos - i) < 0.5;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isActive ? "h-4 bg-primary" : "h-1.5 bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>

        {/* Corner labels */}
        <div className="absolute top-6 left-6 md:left-10">
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Scroll to explore</span>
        </div>
        <div className="absolute top-6 right-6 md:right-10">
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">DUZZ / Platform</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────── */

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const initReveal = useScrollReveal();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const cleanup = initReveal(rootRef.current);
    return cleanup;
  }, [initReveal]);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground">

      {/* ─── Floating Island Header ─────────────────────────── */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 navbar-float">
        <div className="max-w-6xl mx-auto">
          <div className="backdrop-blur-2xl bg-background/80 dark:bg-background/60 border border-border/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-shadow duration-300">
            <div className="flex items-center justify-between h-14 px-6 md:px-8">
              <Link href="/" className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 shrink-0"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
                    WebkitMaskImage: "url(/logo-white.png)",
                    maskImage: "url(/logo-white.png)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
                <span className="font-bold text-lg tracking-tight">DUZZ</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                {[
                  { href: "#features", label: "Features" },
                  { href: "#how-it-works", label: "How It Works" },
                  { href: "#impact", label: "Impact" },
                  { href: "/events", label: "Events" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-all duration-200 relative group rounded-full hover:bg-accent/50"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground rounded-full"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-4 w-4 hidden dark:block" />
                  <Moon className="h-4 w-4 block dark:hidden" />
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[13px] h-8 rounded-full px-4" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <LiquidMetalButton
                    label="Get Started"
                    onClick={() => router.push('/login')}
                  />
                </div>
                {/* Mobile menu button */}
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden rounded-full">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero with 3D Spline ───────────────────────────── */}
        <section className="relative min-h-screen overflow-hidden bg-black/95 dark:bg-black/95">
          {/* Background effects */}
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />
          <div className="absolute inset-0 grid-bg opacity-20 dark:opacity-30" />
          <Particles />

          {/* Main content container */}
          <div className="relative min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-6 py-20 pt-28 w-full">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left content - Text */}
                <div className="relative z-10">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-[11px] uppercase tracking-[0.2em] text-primary/80 border border-primary/15 bg-primary/5 font-medium">
                    <Zap className="h-3 w-3" />
                    AI-Powered DECA Preparation
                  </div>

                  {/* Heading */}
                  <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-[-0.04em] leading-[1.05] bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                    Your Gateway to{" "}
                    <span className="text-primary text-glow">Winning</span>{" "}
                    at DECA
                  </h1>

                  {/* Subheading */}
                  <p className="text-[15px] md:text-base text-neutral-300 dark:text-neutral-300 max-w-lg mt-6 leading-relaxed">
                    From idea to competition-ready pitch deck. AI mentoring, judge simulation, and compliance checking — all in one platform.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                    <LiquidMetalButton
                      label="Get Started"
                      onClick={() => router.push('/login')}
                    />
                    <LiquidMetalButton
                      label="Join Game"
                      onClick={() => router.push('/play')}
                    />
                    <Button size="lg" variant="neon" className="h-11 px-7" asChild>
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
                    <div>
                      <div className="text-2xl font-bold text-white">50+</div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wider">Events</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">87%</div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wider">Score Boost</div>
                    </div>
                  </div>
                </div>

                {/* Right content - 3D Scene */}
                <div className="relative h-[500px] lg:h-[600px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent z-10 pointer-events-none lg:hidden" />
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                  {/* Gradient overlay for better text readability on mobile */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none lg:hidden" />
                </div>
              </div>
            </div>

            {/* Scroll cue */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
              <span className="text-[9px] uppercase tracking-[0.25em] font-medium">Scroll</span>
              <div className="relative w-px h-10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                <div className="absolute top-0 w-px h-3 bg-white/60 animate-bounce" />
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

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                accent={f.accent}
                index={i}
              />
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
                Real results from students who used DUZZ to prepare for competition.
              </p>
            </div>

            <div className="reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-5">
              {impactStats.map((stat) => (
                <ImpactCard
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  icon={stat.icon}
                  sub={stat.sub}
                />
              ))}
            </div>

            {/* Testimonial */}
            <div className="reveal mt-14 text-center">
              <blockquote className="text-muted-foreground italic max-w-lg mx-auto text-[15px] leading-relaxed">
                &ldquo;DUZZ helped me go from not knowing where to start to winning 1st place at States in my first year competing.&rdquo;
              </blockquote>
              <cite className="mt-3 block text-[11px] text-muted-foreground/60 not-italic uppercase tracking-wider">
                DECA Chapter President, California
              </cite>
            </div>
          </div>
        </section>

        {/* ─── Marquee 2 ─────────────────────── */}
        <Marquee />

        {/* ─── Testimonials ───────────────────── */}
        <TestimonialsSection />

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
              <div className="mt-8">
                <LiquidMetalButton
                  label="Get Started Free"
                  onClick={() => router.push('/login')}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-[18px] h-[18px] shrink-0 opacity-30"
              style={{
                background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
                WebkitMaskImage: "url(/logo-white.png)",
                maskImage: "url(/logo-white.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
            <span className="text-[11px] text-muted-foreground/60">DUZZ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/host"
              className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Host
            </Link>
            <p className="text-[11px] text-muted-foreground/50">
              DUZZ is not affiliated with DECA Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
