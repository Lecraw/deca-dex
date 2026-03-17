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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] dark:border-white/[0.06] backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-white.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={32} height={32} className="w-8 h-8 dark:hidden block" />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/events" className="hover:text-foreground transition-colors">Events</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,oklch(0.30_0.12_265/0.20)_0%,transparent_70%)] pointer-events-none dark:block hidden" />

          <div className="max-w-6xl mx-auto px-6 pt-28 pb-24 md:pt-40 md:pb-32 text-center relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Futuristic DECA Preparation</p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] max-w-4xl mx-auto">
              Your Gateway to{" "}
              <span className="text-primary">Winning</span>{" "}
              at DECA
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mt-8 leading-relaxed">
              From idea to competition-ready pitch deck. AI mentoring, judge simulation, and compliance checking — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
              <Button size="lg" className="h-11 px-6 rounded-full" asChild>
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6 rounded-full border-white/[0.1] dark:border-white/[0.1]" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>

          {/* Divider line */}
          <div className="max-w-6xl mx-auto px-6">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] dark:via-white/[0.08] to-transparent" />
          </div>
        </section>

        {/* Stats bar */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] dark:bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06] dark:border-white/[0.06]">
            {[
              { value: "50+", label: "DECA Events" },
              { value: "AI", label: "Powered Feedback" },
              { value: "24/7", label: "Practice Anytime" },
              { value: "Free", label: "To Get Started" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background p-6 md:p-8 text-center">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything You Need</h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              One platform for every step of your DECA journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-card p-6 space-y-4 hover:border-white/[0.12] dark:hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] dark:via-white/[0.08] to-transparent" />
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Process</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Go from zero to competition-ready in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Pick Your Event", desc: "Select from all DECA competitive events" },
              { step: "02", title: "Generate Ideas", desc: "AI brainstorms business ideas for you" },
              { step: "03", title: "Build Your Project", desc: "Step-by-step guided creation with AI" },
              { step: "04", title: "Present & Win", desc: "Export, practice, and compete" },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-card p-6 space-y-4">
                <span className="text-xs font-mono text-muted-foreground">{item.step}</span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] dark:via-white/[0.08] to-transparent" />
        </div>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Get Started</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to Win at DECA?</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Join students across the country using AI to build better projects faster.
          </p>
          <Button size="lg" className="mt-8 h-11 px-6 rounded-full" asChild>
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] dark:border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Nexari is not affiliated with DECA Inc.
        </div>
      </footer>
    </div>
  );
}
