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
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Lightbulb,
    title: "AI Idea Generator",
    description:
      "Generate creative business ideas tailored to your DECA event with AI-powered brainstorming.",
    gradient: "from-violet-500/20 to-blue-500/20",
    iconColor: "text-violet-400 dark:text-violet-400",
  },
  {
    icon: Presentation,
    title: "Pitch Deck Builder",
    description:
      "Create professional pitch decks with drag-and-drop slides, AI suggestions, and auto-formatting.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400 dark:text-blue-400",
  },
  {
    icon: FileText,
    title: "Report Writer",
    description:
      "Build structured written reports with section-by-section guidance and AI writing assistance.",
    gradient: "from-cyan-500/20 to-purple-500/20",
    iconColor: "text-cyan-400 dark:text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Judge Simulator",
    description:
      "Get scored by an AI judge using the official DECA rubric before competition day.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400 dark:text-purple-400",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Checker",
    description:
      "Automatically verify your project meets all DECA requirements — slide counts, sections, formatting.",
    gradient: "from-pink-500/20 to-violet-500/20",
    iconColor: "text-pink-400 dark:text-pink-400",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Earn XP, unlock badges, and climb the leaderboard as you build your project.",
    gradient: "from-amber-500/20 to-violet-500/20",
    iconColor: "text-amber-400 dark:text-amber-400",
  },
];

const stats = [
  { value: "50+", label: "DECA Events" },
  { value: "AI", label: "Powered Feedback" },
  { value: "24/7", label: "Practice Anytime" },
  { value: "Free", label: "To Get Started" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.22_280/0.15)_0%,transparent_70%)] animate-float-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.20_255/0.12)_0%,transparent_70%)] animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.18_300/0.06)_0%,transparent_60%)] animate-pulse-glow" />
      </div>

      {/* Header */}
      <header className="border-b border-white/[0.06] dark:border-white/[0.06] backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:hidden block" />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border-0 shadow-lg shadow-violet-500/20" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-24 pb-20 md:pt-36 md:pb-32 relative">
          {/* Hero gradient mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[conic-gradient(from_180deg_at_50%_50%,oklch(0.40_0.22_280/0.20)_0deg,oklch(0.40_0.20_255/0.15)_120deg,oklch(0.45_0.18_300/0.10)_240deg,oklch(0.40_0.22_280/0.20)_360deg)] blur-[100px] opacity-60" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 dark:border-violet-400/20 bg-violet-500/10 dark:bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered DECA Assistant
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Build Winning DECA Projects{" "}
              <span className="text-gradient dark:text-gradient text-gradient-light">with AI</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              From idea to competition-ready pitch deck in one platform. Nexari
              guides you step-by-step through every DECA event with AI mentoring,
              judge simulation, and automatic compliance checking.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border-0 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02]" asChild>
                <Link href="/login">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/10" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gradient dark:text-gradient text-gradient-light">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 mb-4">
                <Zap className="w-3 h-3" />
                Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                One platform for every step of your DECA journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-card/40 dark:bg-card/40 backdrop-blur-sm p-6 space-y-4 hover:border-violet-500/30 dark:hover:border-violet-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/15 border border-white/[0.06] dark:border-white/[0.06]">
                      <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-lg mt-4">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 relative">
          {/* Section gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.03] to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 mb-4">
                <Shield className="w-3 h-3" />
                How It Works
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Zero to Competition-Ready</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Four simple steps to your best DECA project
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Pick Your Event", desc: "Select from all DECA competitive events", icon: "🎯" },
                { step: "2", title: "Generate Ideas", desc: "AI brainstorms business ideas for you", icon: "💡" },
                { step: "3", title: "Build Your Project", desc: "Step-by-step guided creation with AI", icon: "🛠" },
                { step: "4", title: "Present & Win", desc: "Export, practice, and compete with confidence", icon: "🏆" },
              ].map((item, idx) => (
                <div key={item.step} className="text-center space-y-4 relative">
                  {/* Connector line */}
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                  )}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 text-2xl">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="relative rounded-3xl overflow-hidden max-w-4xl mx-auto">
              {/* CTA gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 to-blue-700/90" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.55_0.25_280/0.4)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.50_0.20_255/0.3)_0%,transparent_60%)]" />

              <div className="relative z-10 py-16 px-8 md:px-16 text-center text-white">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Win at DECA?</h2>
                <p className="mt-4 text-violet-100/80 max-w-lg mx-auto text-lg">
                  Join students across the country using AI to build better DECA
                  projects faster.
                </p>
                <Button size="lg" className="mt-8 h-12 px-8 bg-white text-violet-700 hover:bg-white/90 shadow-lg border-0 hover:scale-[1.02] transition-all" asChild>
                  <Link href="/login">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] dark:border-white/[0.06] py-8 relative z-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Nexari is not affiliated with DECA Inc.
        </div>
      </footer>
    </div>
  );
}
