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
  { value: "12,400+", label: "Students Helped", icon: Users, sub: "Across 380+ hs" },
  { value: "87%", label: "Score Impr", icon: TrendingUp, sub: "Official rubrics" },
  { value: "2,300+", label: "Projects Built", icon: Target, sub: "Comp-ready" },
  { value: "340+", label: "Roleplays Won", icon: Award, sub: "ICDC level" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background noise-bg text-foreground antialiased selection:bg-primary/20">
      {/* ─── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-2xl border-b border-border/20">
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
            <Link href="/login" className="hidden sm:inline-flex text-[14px] font-medium px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="h-9 px-5 flex items-center justify-center text-[14px] rounded-full font-medium tracking-tight skeuo-btn">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero ───────────────────────────── */}
        <section className="relative pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden">
          {/* Floating Decor: Laptop */}
          <div className="absolute top-32 -left-10 lg:left-[5%] hidden md:block animate-float">
            <div className="skeuo-card p-2 rounded-3xl w-[220px] lg:w-[280px] bg-white dark:bg-card">
              <Image src="/laptop.png" alt="DECA Pitch Deck" width={280} height={280} className="rounded-2xl w-full h-auto" />
            </div>
          </div>

          {/* Floating Decor: Keyboard */}
          <div className="absolute top-52 -right-10 lg:right-[5%] hidden md:block animate-float-delay">
            <div className="skeuo-card p-2 rounded-3xl w-[200px] lg:w-[260px] bg-white dark:bg-card">
              <Image src="/keyboard.png" alt="Workspace" width={260} height={260} className="rounded-2xl w-full h-auto" />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full skeuo-inset text-[12px] font-medium text-muted-foreground tracking-wide">
              <Zap className="h-3.5 w-3.5 text-primary drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]" />
              <span>AI-Powered DECA Preparation</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto text-foreground">
              Build Winning Projects <br className="hidden md:block" />
              <span className="text-primary drop-shadow-sm">with AI</span>
            </h1>

            {/* Subheading */}
            <p className="text-[17px] md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              From idea generation to your final competition-ready pitch deck. Get AI mentoring, judge simulations, and compliance checking in one workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full sm:w-auto">
              <Link href="/login" className="h-14 px-8 flex items-center justify-center rounded-full text-lg font-medium w-full sm:w-auto skeuo-btn">
                Start for free
              </Link>
              <Link href="/events" className="h-14 px-8 flex items-center justify-center rounded-full text-lg font-medium w-full sm:w-auto skeuo-btn-secondary text-foreground">
                Browse Events
              </Link>
            </div>
            
            {/* CSS Laptop Dashboard Mockup */}
            <div className="mt-24 w-full max-w-5xl mx-auto relative perspective-[1000px]">
              
              {/* Laptop Screen */}
              <div className="relative mx-auto border-[8px] md:border-[12px] border-[#1a1a1a] rounded-t-2xl md:rounded-t-3xl bg-[#0a0a0a] w-[90%] aspect-[16/10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-10">
                {/* Camera Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 md:w-24 h-4 bg-[#1a1a1a] rounded-b-xl z-50 flex justify-center items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50 flex justify-center items-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-blue-400" />
                  </div>
                </div>

                {/* --- FAKE DASHBOARD HTML --- */}
                <div className="flex-1 flex bg-background w-full h-full relative">
                  
                  {/* Fake Sidebar */}
                  <div className="w-[20%] border-r border-border/50 bg-background/50 flex flex-col p-3">
                    <div className="flex items-center gap-2 mb-6 px-2">
                       <div className="w-5 h-5 rounded bg-primary/20 flex-shrink-0" />
                       <div className="w-16 h-3 rounded-full bg-foreground/20" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-7 rounded-lg skeuo-inset flex items-center px-2 gap-2">
                         <div className="w-3 h-3 rounded bg-primary" />
                         <div className="w-12 h-2 rounded-full bg-primary/70" />
                      </div>
                      <div className="w-full h-7 rounded-lg flex items-center px-2 gap-2 opacity-50">
                         <div className="w-3 h-3 rounded bg-muted-foreground" />
                         <div className="w-14 h-2 rounded-full bg-muted-foreground" />
                      </div>
                      <div className="w-full h-7 rounded-lg flex items-center px-2 gap-2 opacity-50">
                         <div className="w-3 h-3 rounded bg-muted-foreground" />
                         <div className="w-10 h-2 rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Fake Main Content */}
                  <div className="flex-1 flex flex-col bg-muted/10">
                    {/* Fake Topbar */}
                    <div className="h-10 border-b border-border/50 flex items-center justify-between px-4">
                      <div className="w-24 h-3 rounded-full bg-foreground/10" />
                      <div className="flex items-center gap-2">
                         <div className="w-16 h-4 rounded-full skeuo-inset" />
                         <div className="w-6 h-6 rounded-full skeuo-card" />
                      </div>
                    </div>

                    {/* Fake Content Grid */}
                    <div className="p-4 flex-1 flex flex-col gap-4">
                       <div className="grid grid-cols-3 gap-3">
                          <div className="h-16 rounded-xl skeuo-card p-3 flex flex-col justify-center gap-2">
                            <div className="w-8 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-12 h-4 rounded-full bg-foreground" />
                          </div>
                          <div className="h-16 rounded-xl skeuo-card p-3 flex flex-col justify-center gap-2">
                            <div className="w-8 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-16 h-4 rounded-full bg-foreground" />
                          </div>
                          <div className="h-16 rounded-xl skeuo-card p-3 flex flex-col justify-center gap-2">
                            <div className="w-8 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-10 h-4 rounded-full bg-foreground" />
                          </div>
                       </div>
                       
                       <div className="flex-1 rounded-xl skeuo-inset p-4 flex flex-col gap-3 relative overflow-hidden">
                          <div className="w-24 h-3 rounded-full bg-foreground/20" />
                          <div className="flex-1 flex items-end gap-2 mt-2">
                             <div className="w-full bg-primary/40 rounded-t-sm h-[40%]" />
                             <div className="w-full bg-primary/60 rounded-t-sm h-[70%]" />
                             <div className="w-full bg-primary/30 rounded-t-sm h-[30%]" />
                             <div className="w-full bg-primary/80 rounded-t-sm h-[90%]" />
                             <div className="w-full bg-primary rounded-t-sm h-[100%]" />
                             <div className="w-full bg-primary/50 rounded-t-sm h-[60%]" />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop Base */}
              <div className="relative mx-auto w-full h-4 md:h-6 bg-gradient-to-b from-[#b3b3b3] to-[#8c8c8c] dark:from-[#3a3a3a] dark:to-[#1a1a1a] rounded-b-2xl md:rounded-b-3xl shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex justify-center z-20">
                <div className="w-24 md:w-32 h-1.5 md:h-2 bg-[#8c8c8c] dark:bg-[#111] rounded-b-lg md:rounded-b-xl" />
              </div>

              {/* Laptop Lip Reflection */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[90%] h-20 bg-gradient-to-b from-black/20 to-transparent blur-xl pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────── */}
        <section id="features" className="py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-muted/30 -z-10 skew-y-1 transform origin-top-left" />
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">Everything You Need</h2>
              <p className="text-muted-foreground mt-4 text-[17px] leading-relaxed">A complete toolkit designed exclusively for DECA competitors to streamline research, writing, and presentation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="group skeuo-card p-8 transition-transform duration-300 hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl skeuo-inset text-primary mb-6">
                    <f.icon className="h-6 w-6 drop-shadow-sm" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-xl text-foreground mb-3">{f.title}</h3>
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
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">How It Works</h2>
              <p className="text-muted-foreground mt-4 text-[17px]">Four steps from blank slate to competition ready.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12 relative">
              <div className="hidden md:block absolute top-[28px] left-8 right-8 h-1 skeuo-inset rounded-full" />
              {steps.map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col">
                  <div className="w-14 h-14 rounded-full skeuo-card flex items-center justify-center text-primary font-bold text-xl mb-6 border-border/20">
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Noteook Graphic Floating Over Steps */}
            <div className="mt-20 w-full flex justify-center animate-float-delay">
              <div className="skeuo-card p-2 rounded-[2rem] max-w-sm bg-white dark:bg-card -rotate-2">
                <Image src="/notebook.png" alt="Research Notebook" width={400} height={400} className="rounded-[1.5rem] w-full h-auto shadow-inner" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Impact Stats ──────────────────── */}
        <section id="impact" className="py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-muted/30 -z-10 -skew-y-1 transform origin-bottom-right" />
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-16 drop-shadow-sm">
              Trusted by Top Competitors
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {impactStats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center skeuo-inset p-6 rounded-3xl">
                  <div className="w-12 h-12 rounded-full skeuo-card flex items-center justify-center text-primary mb-5">
                    <stat.icon className="h-5 w-5 drop-shadow-sm" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2 drop-shadow-sm">
                    {stat.value}
                  </div>
                  <div className="text-[15px] font-semibold text-foreground mb-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-20 max-w-3xl mx-auto p-2 skeuo-card">
              <div className="skeuo-inset rounded-2xl p-8 text-center">
                <blockquote className="text-lg md:text-xl text-foreground font-medium leading-relaxed italic">
                  "Nexari helped me go from not knowing where to start to winning 1st place at States in my very first year competing."
                </blockquote>
                <div className="mt-6 inline-block w-12 h-1 bg-primary rounded-full opacity-50 mb-3" />
                <div className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                  DECA Chapter President
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────── */}
        <section className="py-32">
          <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 drop-shadow-sm">
              Ready to Win?
            </h2>
            <p className="text-[17px] md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of students building their DECA projects with intelligent AI assistance.
            </p>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full px-12 h-16 text-xl font-semibold skeuo-btn">
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6 drop-shadow-sm" />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="py-10 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-white.png" alt="" width={20} height={20} className="w-5 h-5 dark:block hidden object-contain grayscale opacity-50" />
            <Image src="/logo.png" alt="" width={20} height={20} className="w-5 h-5 dark:hidden block object-contain grayscale opacity-50" />
            <span className="text-[14px] font-semibold text-muted-foreground tracking-wide">Nexari</span>
          </div>
          <p className="text-[13px] text-muted-foreground font-medium">
            Non-affiliated educational tool. Not associated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
