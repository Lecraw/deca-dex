"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Presentation,
  FileText,
  BarChart3,
  CheckCircle2,
  Trophy,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Users,
  Award,
  Target,
  Zap
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Lightbulb,
    title: "AI Idea Generator",
    description: "Generate creative business ideas tailored to your DECA event with AI-powered brainstorming.",
  },
  {
    icon: Presentation,
    title: "Pitch Deck Builder",
    description: "Create professional pitch decks with drag-and-drop slides, AI suggestions, and auto-formatting.",
  },
  {
    icon: FileText,
    title: "Report Writer",
    description: "Build structured written reports with section-by-section guidance and AI writing assistance.",
  },
  {
    icon: BarChart3,
    title: "Judge Simulator",
    description: "Get scored by an AI judge using the official DECA rubric before competition day.",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Checker",
    description: "Automatically verify your project meets all DECA requirements — slide counts, sections, formatting.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn XP, unlock badges, and climb the leaderboard as you build your project.",
  },
];

const steps = [
  { num: "1", title: "Pick Your Event", desc: "Select from all DECA competitive events." },
  { num: "2", title: "Generate Ideas", desc: "Use AI to brainstorm standout business concepts." },
  { num: "3", title: "Build Your Project", desc: "Create your deck and report with step-by-step guidance." },
  { num: "4", title: "Present & Win", desc: "Export, practice, and confidently compete." },
];

const impactStats = [
  { value: "12,400+", label: "Students Helped", icon: Users, sub: "Across 380+ high schools" },
  { value: "87%", label: "Score Improvement", icon: TrendingUp, sub: "On official judge rubrics" },
  { value: "2,300+", label: "Projects Built", icon: Target, sub: "Competition-ready materials" },
  { value: "340+", label: "Competition Wins", icon: Award, sub: "From districts to ICDC" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* ─── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={28} height={28} className="w-7 h-7 dark:block hidden object-contain" />
            <Image src="/logo.png" alt="Nexari" width={28} height={28} className="w-7 h-7 dark:hidden block object-contain" />
            <span className="font-semibold text-lg tracking-tight">Nexari</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-muted-foreground mr-6">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#impact" className="hover:text-foreground transition-colors">Impact</Link>
            <Link href="/events" className="hover:text-foreground transition-colors">Events</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-[14px] font-medium h-9 rounded-full" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="h-9 px-4 text-[14px] rounded-full font-medium tracking-tight shadow-sm" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero ───────────────────────────── */}
        <section className="relative pt-36 pb-24 md:pt-48 md:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full border border-border/50 bg-muted/30 text-[12px] font-medium text-muted-foreground tracking-wide">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>AI-Powered DECA Preparation</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto text-foreground">
              Build Winning Projects <br className="hidden md:block" />
              <span className="text-primary">with AI</span>
            </h1>

            {/* Subheading */}
            <p className="text-[17px] md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              From idea generation to your final competition-ready pitch deck. Get AI mentoring, judge simulations, and compliance checking in one workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" className="h-12 px-8 rounded-full text-base font-medium shadow-sm w-full sm:w-auto" asChild>
                <Link href="/login">
                  Start for free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base font-medium w-full sm:w-auto border-border/60 hover:bg-muted/50 transition-colors" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
            
            {/* Minimalist Dashboard Preview Graphic */}
            <div className="mt-20 w-full max-w-5xl rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.04)] aspect-video overflow-hidden flex flex-col relative mx-auto">
              <div className="h-10 border-b border-border/40 flex items-center px-4 gap-2 bg-muted/20">
                <div className="w-3 h-3 rounded-full bg-border/80" />
                <div className="w-3 h-3 rounded-full bg-border/80" />
                <div className="w-3 h-3 rounded-full bg-border/80" />
              </div>
              <div className="flex-1 flex items-center justify-center bg-muted/10">
                <div className="flex flex-col items-center gap-4 opacity-50">
                  <Image src="/logo.png" alt="" width={64} height={64} className="w-16 h-16 dark:hidden object-contain grayscale opacity-60" />
                  <Image src="/logo-white.png" alt="" width={64} height={64} className="w-16 h-16 hidden dark:block object-contain opacity-60" />
                  <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────── */}
        <section id="features" className="py-24 md:py-32 bg-muted/20 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Everything You Need</h2>
              <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed">A complete toolkit designed exclusively for DECA competitors to streamline research, writing, and presentation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="group relative bg-card p-8 rounded-3xl border border-border/40 hover:border-border/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-6 transition-transform duration-300 group-hover:scale-110">
                    <f.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-3">{f.title}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ──────────────────── */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">How It Works</h2>
              <p className="text-muted-foreground mt-4 text-[17px]">Four steps from blank slate to competition ready.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12 relative">
              <div className="hidden md:block absolute top-6 left-8 right-8 h-px bg-border/60" />
              {steps.map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col">
                  <div className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-primary font-semibold text-lg mb-6 shadow-sm">
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Impact Stats ──────────────────── */}
        <section id="impact" className="py-24 md:py-32 bg-muted/20 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-16">
              Trusted by Top Competitors
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {impactStats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground mb-5 shadow-sm">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-4xl font-bold tracking-tight text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[15px] font-medium text-foreground mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-20 max-w-2xl mx-auto px-6 py-8 rounded-3xl bg-card border border-border/40 shadow-sm relative">
              <blockquote className="text-[17px] text-foreground font-medium leading-relaxed italic">
                "Nexari helped me go from not knowing where to start to winning 1st place at States in my very first year competing."
              </blockquote>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="w-6 h-px bg-border/60" />
                <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">DECA Chapter President</span>
                <div className="w-6 h-px bg-border/60" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────── */}
        <section className="py-32">
          <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Ready to Win?
            </h2>
            <p className="text-[17px] md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join thousands of students building their DECA projects with intelligent AI assistance.
            </p>
            <Button size="lg" className="rounded-full px-10 h-14 text-lg font-medium shadow-md" asChild>
              <Link href="/login">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="border-t border-border/40 py-10 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-white.png" alt="" width={20} height={20} className="w-5 h-5 dark:block hidden object-contain grayscale opacity-50" />
            <Image src="/logo.png" alt="" width={20} height={20} className="w-5 h-5 dark:hidden block object-contain grayscale opacity-50" />
            <span className="text-[13px] font-medium text-muted-foreground tracking-wide">Nexari</span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Non-affiliated educational tool. Not associated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
