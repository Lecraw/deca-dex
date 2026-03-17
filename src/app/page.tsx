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
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Lightbulb,
    title: "AI Idea Generator",
    description:
      "Generate creative business ideas tailored to your DECA event with AI-powered brainstorming.",
  },
  {
    icon: Presentation,
    title: "Pitch Deck Builder",
    description:
      "Create professional pitch decks with drag-and-drop slides, AI suggestions, and auto-formatting.",
  },
  {
    icon: FileText,
    title: "Report Writer",
    description:
      "Build structured written reports with section-by-section guidance and AI writing assistance.",
  },
  {
    icon: BarChart3,
    title: "Judge Simulator",
    description:
      "Get scored by an AI judge using the official DECA rubric before competition day.",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Checker",
    description:
      "Automatically verify your project meets all DECA requirements — slide counts, sections, formatting.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Earn XP, unlock badges, and climb the leaderboard as you build your project.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[300px] left-1/4 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.22_260/0.12)_0%,transparent_70%)] animate-float-slow" />
        <div className="absolute top-[40%] -right-[200px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.20_240/0.10)_0%,transparent_70%)] animate-float-slower" />
        <div className="absolute -bottom-[200px] left-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.18_270/0.08)_0%,transparent_60%)] animate-pulse-glow" />
      </div>

      {/* Header — glass navbar */}
      <header className="sticky top-0 z-50 dark:glass glass-light">
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
            <Button className="bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-600/20" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-24 pb-20 md:pt-36 md:pb-28">
          <div className="container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full dark:glass glass-light px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered DECA Assistant
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Build Winning DECA Projects{" "}
              <span className="text-gradient dark:text-gradient text-gradient-light">with AI</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              From idea to competition-ready pitch deck in one platform. Nexari
              guides you step-by-step through every DECA event with AI mentoring,
              judge simulation, and automatic compliance checking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]" asChild>
                <Link href="/login">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base dark:glass glass-light hover:bg-white/10 dark:hover:bg-white/10 border-0" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: "50+", label: "DECA Events" },
                { value: "AI", label: "Powered Feedback" },
                { value: "24/7", label: "Practice Anytime" },
                { value: "Free", label: "To Get Started" },
              ].map((stat) => (
                <div key={stat.label} className="dark:glass glass-light rounded-2xl p-5 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                One platform for every step of your DECA journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group dark:glass glass-light rounded-2xl p-6 space-y-4 hover:border-blue-500/30 dark:hover:border-blue-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/10 dark:border-blue-400/10">
                    <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Go from zero to competition-ready in 4 simple steps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Pick Your Event", desc: "Select from all DECA competitive events" },
                { step: "2", title: "Generate Ideas", desc: "AI brainstorms business ideas for you" },
                { step: "3", title: "Build Your Project", desc: "Step-by-step guided creation with AI" },
                { step: "4", title: "Present & Win", desc: "Export, practice, and compete with confidence" },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl dark:glass-strong glass-light-strong text-xl font-bold text-blue-600 dark:text-blue-400">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden max-w-4xl mx-auto dark:glass-strong glass-light-strong">
              {/* Blue glow behind */}
              <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.22_260/0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="relative z-10 py-16 px-8 md:px-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Win at DECA?</h2>
                <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
                  Join students across the country using AI to build better DECA
                  projects faster.
                </p>
                <Button size="lg" className="mt-8 h-12 px-8 bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all" asChild>
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
