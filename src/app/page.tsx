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
  TrendingUp,
  Users,
  Award,
  Target,
  Zap,
  ChevronRight
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
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-hidden">
      {/* Glassmorphism Background Orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* ─── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-x-0 border-t-0 rounded-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:block hidden object-contain" />
            <Image src="/logo.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:hidden block object-contain" />
            <span className="font-bold text-xl tracking-tight">Nexari</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-foreground/80">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
            <Link href="#impact" className="hover:text-primary transition-colors">Impact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-flex text-[15px] font-semibold hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="h-10 px-6 flex items-center justify-center text-[14px] rounded-full font-bold tracking-tight glass-btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero ───────────────────────────── */}
        <section className="relative pt-44 pb-24 md:pt-52 md:pb-32">
          
          {/* Floating 3D Decor: Laptop */}
          <div className="absolute top-36 -left-8 lg:left-[5%] hidden md:block animate-float">
            <div className="glass-card p-3 rounded-3xl w-[260px] lg:w-[320px]">
              <Image src="/laptop.png" alt="DECA Pitch Deck" width={320} height={320} className="w-full h-auto drop-shadow-2xl" />
            </div>
          </div>

          {/* Floating Decor: Keyboard */}
          <div className="absolute top-64 -right-8 lg:right-[5%] hidden md:block animate-float-delay">
            <div className="glass-card p-3 rounded-3xl w-[220px] lg:w-[280px]">
              <Image src="/keyboard.png" alt="Workspace" width={280} height={280} className="w-full h-auto drop-shadow-2xl" />
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 md:px-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full glass-card text-[13px] font-bold text-foreground/80 tracking-wide uppercase">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              AI-Powered DECA Preparation
            </div>

            {/* Heading */}
            <h1 className="text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-extrabold tracking-tighter leading-[1.05] text-foreground">
              Build Winning<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Projects Faster
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-2xl text-foreground/70 max-w-2xl mx-auto mt-8 leading-relaxed font-medium">
              The ultimate workspace for DECA competitors. Generate ideas, simulate judges, and build pitch decks with bleeding-edge AI.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-12 w-full sm:w-auto">
              <Link href="/login" className="h-14 px-10 flex items-center justify-center rounded-full text-lg font-bold w-full sm:w-auto glass-btn-primary shadow-2xl shadow-primary/30">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/events" className="h-14 px-10 flex items-center justify-center rounded-full text-lg font-bold w-full sm:w-auto glass-btn">
                Browse Events
              </Link>
            </div>
            
            {/* CSS Laptop Dashboard Mockup */}
            <div className="mt-32 w-full max-w-5xl mx-auto relative perspective-[1000px] hover:-translate-y-2 transition-transform duration-500">
              
              {/* Laptop Screen */}
              <div className="relative mx-auto border-[10px] md:border-[16px] border-[#1a1a1a] rounded-t-[1.5rem] md:rounded-t-[2rem] bg-[#0a0a0a] w-[95%] aspect-[16/10] shadow-2xl overflow-hidden flex flex-col z-10">
                {/* Camera Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-32 h-5 bg-[#1a1a1a] rounded-b-2xl z-50 flex justify-center items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-900/50 flex justify-center items-center">
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                  </div>
                </div>

                {/* --- FAKE DASHBOARD HTML --- */}
                <div className="flex-1 flex bg-background w-full h-full relative">
                  
                  {/* Fake Sidebar */}
                  <div className="w-[20%] border-r border-border/50 glass-panel border-y-0 border-l-0 rounded-none flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-8 px-2">
                       <div className="w-6 h-6 rounded-lg bg-primary/20 flex-shrink-0" />
                       <div className="w-20 h-4 rounded-full bg-foreground/20" />
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-8 rounded-lg bg-primary/20 flex items-center px-3 gap-2">
                         <div className="w-3 h-3 rounded bg-primary" />
                         <div className="w-16 h-2 rounded-full bg-primary/70" />
                      </div>
                      <div className="w-full h-8 rounded-lg flex items-center px-3 gap-2 opacity-50">
                         <div className="w-3 h-3 rounded bg-muted-foreground" />
                         <div className="w-20 h-2 rounded-full bg-muted-foreground" />
                      </div>
                      <div className="w-full h-8 rounded-lg flex items-center px-3 gap-2 opacity-50">
                         <div className="w-3 h-3 rounded bg-muted-foreground" />
                         <div className="w-12 h-2 rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Fake Main Content */}
                  <div className="flex-1 flex flex-col relative">
                    {/* Glass gradient inside dashboard */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

                    {/* Fake Topbar */}
                    <div className="h-12 border-b border-border/50 flex items-center justify-between px-6 glass-panel rounded-none border-t-0 border-x-0">
                      <div className="w-32 h-4 rounded-full bg-foreground/10" />
                      <div className="flex items-center gap-3">
                         <div className="w-20 h-5 rounded-full bg-primary/10" />
                         <div className="w-8 h-8 rounded-full border-2 border-primary/50" />
                      </div>
                    </div>

                    {/* Fake Content Grid */}
                    <div className="p-6 flex-1 flex flex-col gap-6">
                       <div className="grid grid-cols-3 gap-4">
                          <div className="h-20 rounded-2xl glass-card p-4 flex flex-col justify-center gap-3">
                            <div className="w-10 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-16 h-5 rounded-full bg-foreground" />
                          </div>
                          <div className="h-20 rounded-2xl glass-card p-4 flex flex-col justify-center gap-3">
                            <div className="w-10 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-24 h-5 rounded-full bg-foreground" />
                          </div>
                          <div className="h-20 rounded-2xl glass-card p-4 flex flex-col justify-center gap-3">
                            <div className="w-10 h-2 rounded-full bg-muted-foreground/50" />
                            <div className="w-14 h-5 rounded-full bg-foreground" />
                          </div>
                       </div>
                       
                       <div className="flex-1 rounded-2xl glass-card p-6 flex flex-col gap-4 relative overflow-hidden">
                          <div className="w-32 h-4 rounded-full bg-foreground/20" />
                          <div className="flex-1 flex items-end gap-3 mt-4">
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
              <div className="relative mx-auto w-full h-5 md:h-8 bg-gradient-to-b from-[#e6e6e6] to-[#a3a3a3] dark:from-[#3a3a3a] dark:to-[#1a1a1a] rounded-b-2xl md:rounded-b-3xl shadow-2xl flex justify-center z-20">
                <div className="w-24 md:w-40 h-2 md:h-3 bg-[#a3a3a3] dark:bg-[#111] rounded-b-lg md:rounded-b-2xl" />
              </div>
            </div>

          </div>
        </section>

        {/* ─── Features ──────────────────────── */}
        <section id="features" className="py-24 md:py-32 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">A Complete Ecosystem</h2>
              <p className="text-foreground/70 mt-6 text-lg leading-relaxed">Built from the ground up for serious high school competitors aiming for the ICDC stage.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="group glass-card p-8 rounded-[2rem]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-8 border border-primary/20">
                    <f.icon className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-2xl text-foreground mb-4">{f.title}</h3>
                  <p className="text-foreground/70 text-[16px] leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ──────────────────── */}
        <section id="how-it-works" className="py-24 md:py-32 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="mb-20 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">How It Works</h2>
              <p className="text-foreground/70 mt-6 text-lg max-w-2xl">From absolute scratch to a winning presentation in four highly structured phases.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-[36px] left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              {steps.map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left glass-card p-8 rounded-[2rem]">
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-primary font-black text-2xl mb-8 shadow-xl">
                    {s.num}
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">{s.title}</h3>
                  <p className="text-foreground/70 text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Noteook Graphic Floating Over Steps */}
            <div className="mt-24 w-full flex justify-center animate-float-delay">
              <div className="glass-card p-3 rounded-[2.5rem] w-[400px] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image src="/notebook.png" alt="Research Notebook" width={400} height={400} className="w-full h-auto drop-shadow-2xl rounded-[2rem]" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Impact Stats ──────────────────── */}
        <section id="impact" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-20">
              Trusted by Top Competitors
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {impactStats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center glass-card p-8 rounded-[2rem]">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-3">
                    {stat.value}
                  </div>
                  <div className="text-[17px] font-bold text-foreground mb-1">{stat.label}</div>
                  <div className="text-[14px] text-foreground/60">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────── */}
        <section className="py-32 relative">
          <div className="max-w-4xl mx-auto px-6 md:px-8 text-center glass-panel p-16 rounded-[3rem] border-primary/20 shadow-2xl shadow-primary/10">
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground mb-8">
              Ready to Win?
            </h2>
            <p className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students building their DECA projects with intelligent AI assistance.
            </p>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full px-12 h-16 text-xl font-bold glass-btn-primary mx-auto">
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="py-12 glass-panel border-x-0 border-b-0 rounded-none">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo-white.png" alt="" width={24} height={24} className="w-6 h-6 dark:block hidden object-contain grayscale opacity-60" />
            <Image src="/logo.png" alt="" width={24} height={24} className="w-6 h-6 dark:hidden block object-contain grayscale opacity-60" />
            <span className="text-[16px] font-bold text-foreground/60 tracking-wide">Nexari</span>
          </div>
          <p className="text-[14px] text-foreground/50 font-medium">
            Non-affiliated educational tool. Not associated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
