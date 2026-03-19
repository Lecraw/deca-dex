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
} from "lucide-react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: Lightbulb,
    title: "AI Idea Generator",
    description:
      "Generate creative business ideas tailored to your DECA event with AI-powered brainstorming.",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    icon: Presentation,
    title: "Pitch Deck Builder",
    description:
      "Create professional pitch decks with drag-and-drop slides, AI suggestions, and auto-formatting.",
    accent: "from-violet-400 to-purple-500",
  },
  {
    icon: FileText,
    title: "Report Writer",
    description:
      "Build structured written reports with section-by-section guidance and AI writing assistance.",
    accent: "from-blue-400 to-indigo-500",
  },
  {
    icon: BarChart3,
    title: "Judge Simulator",
    description:
      "Get scored by an AI judge using the official DECA rubric before competition day.",
    accent: "from-emerald-400 to-cyan-500",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Checker",
    description:
      "Automatically verify your project meets all DECA requirements — slide counts, sections, formatting.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Earn XP, unlock badges, and climb the leaderboard as you build your project.",
    accent: "from-pink-400 to-rose-500",
  },
];

const steps = [
  { step: "01", title: "Pick Your Event", desc: "Select from all DECA competitive events", icon: "◆" },
  { step: "02", title: "Generate Ideas", desc: "AI brainstorms business ideas for you", icon: "◇" },
  { step: "03", title: "Build Your Project", desc: "Step-by-step guided creation with AI", icon: "△" },
  { step: "04", title: "Present & Win", desc: "Export, practice, and compete", icon: "○" },
];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 60]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:hidden block" />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors relative group">
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/events" className="hover:text-foreground transition-colors relative group">
              Events
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 grid-bg opacity-50 dark:opacity-100" />

          {/* Radial glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,oklch(0.72_0.19_195/0.12)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,oklch(0.55_0.18_250/0.08)_0%,transparent_60%)] pointer-events-none" />

          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center relative z-10"
          >
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 text-xs uppercase tracking-[0.15em] text-primary border border-primary/20 bg-primary/5 rounded-sm">
                <Zap className="h-3 w-3" />
                AI-Powered DECA Preparation
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] max-w-5xl mx-auto">
                Your Gateway to{" "}
                <span className="text-primary text-glow">Winning</span>{" "}
                at DECA
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mt-8 leading-relaxed">
                From idea to competition-ready pitch deck. AI mentoring, judge simulation, and compliance checking — all in one platform.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                <Button size="lg" className="group" asChild>
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="neon" asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            </FadeIn>

            {/* Scroll indicator */}
            <FadeIn delay={0.5}>
              <motion.div
                className="mt-20 flex flex-col items-center gap-2 text-muted-foreground/50"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
                <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-transparent" />
              </motion.div>
            </FadeIn>
          </motion.div>
        </section>

        {/* Gradient line divider */}
        <div className="gradient-line" />

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "50+", label: "DECA Events" },
              { value: "AI", label: "Powered Feedback" },
              { value: "24/7", label: "Practice Anytime" },
              { value: "Free", label: "To Get Started" },
            ].map((stat) => (
              <StaggerItem key={stat.label} className="text-center relative">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  <CountUp value={stat.value} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-2 uppercase tracking-[0.15em]">{stat.label}</div>
                {/* Subtle bottom accent */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-px bg-primary/30" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <div className="gradient-line" />

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <FadeIn>
            <div className="mb-16 max-w-2xl">
              <span className="text-xs font-mono text-primary uppercase tracking-[0.15em]">// Features</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-3">
                Everything You Need
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                One platform for every step of your DECA journey.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="group relative bg-background p-8 hover:bg-accent/30 transition-all duration-500 cursor-default h-full">
                  {/* Top accent line on hover */}
                  <div className={`absolute top-0 left-0 w-0 h-px bg-gradient-to-r ${feature.accent} group-hover:w-full transition-all duration-500`} />

                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-sm bg-gradient-to-br ${feature.accent} opacity-80 mb-5`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Corner accent */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/0 group-hover:border-primary/30 transition-all duration-500" />
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <div className="gradient-line" />

        {/* How It Works */}
        <section id="how-it-works" className="relative py-24 overflow-hidden">
          {/* Subtle grid behind */}
          <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-60" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FadeIn>
              <div className="mb-16 max-w-2xl">
                <span className="text-xs font-mono text-primary uppercase tracking-[0.15em]">// Process</span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-3">How It Works</h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  Go from zero to competition-ready in four steps.
                </p>
              </div>
            </FadeIn>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((item, i) => (
                  <StaggerItem key={item.step}>
                    <div className="group relative text-center md:text-left">
                      {/* Step number */}
                      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 border border-primary/20 bg-background relative">
                        <span className="text-lg font-mono font-bold text-primary">{item.step}</span>
                        {/* Animated corner accents */}
                        <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-primary/50" />
                        <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-primary/50" />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

                      {/* Arrow to next */}
                      {i < 3 && (
                        <div className="hidden md:block absolute top-6 -right-3 text-primary/30">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        <div className="gradient-line" />

        {/* CTA */}
        <section className="relative py-32 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,oklch(0.72_0.19_195/0.08)_0%,transparent_60%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <FadeIn>
              <span className="text-xs font-mono text-primary uppercase tracking-[0.15em]">// Get Started</span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-4">
                Ready to Win at DECA?
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto text-lg">
                Join students across the country using AI to build better projects faster.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Button size="lg" className="mt-8 group" asChild>
                <Link href="/login">
                  Get Started Free
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </FadeIn>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-white.png" alt="Nexari" width={20} height={20} className="w-5 h-5 dark:block hidden opacity-40" />
            <Image src="/logo.png" alt="Nexari" width={20} height={20} className="w-5 h-5 dark:hidden block opacity-40" />
            <span className="text-xs text-muted-foreground">Nexari</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Nexari is not affiliated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
