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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-white.png" alt="Nexari" width={40} height={40} className="w-10 h-10 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={40} height={40} className="w-10 h-10 dark:hidden block" />
            <span className="font-bold text-lg">Nexari</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.25_0.08_255)_0%,transparent_60%)] opacity-40" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-6">
              <Image src="/logo-white.png" alt="" width={14} height={14} className="w-3.5 h-3.5 dark:block hidden" />
              <Image src="/logo.png" alt="" width={14} height={14} className="w-3.5 h-3.5 dark:hidden block" />
              AI-Powered DECA Assistant
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
              Build Winning DECA Projects{" "}
              <span className="text-primary">with AI</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
              From idea to competition-ready pitch deck in one platform. Nexari
              guides you step-by-step through every DECA event with AI mentoring,
              judge simulation, and automatic compliance checking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Everything You Need</h2>
              <p className="text-muted-foreground mt-2">
                One platform for every step of your DECA journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-card/50 p-6 space-y-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-2">
                Go from zero to competition-ready in 4 simple steps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Pick Your Event", desc: "Select from all DECA competitive events" },
                { step: "2", title: "Generate Ideas", desc: "AI brainstorms business ideas for you" },
                { step: "3", title: "Build Your Project", desc: "Step-by-step guided creation with AI" },
                { step: "4", title: "Present & Win", desc: "Export, practice, and compete with confidence" },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
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
        <section className="py-20 relative overflow-hidden border-t border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.25_0.08_255)_0%,transparent_70%)] opacity-30" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-bold">Ready to Win at DECA?</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Join students across the country using AI to build better DECA
              projects faster.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/login">Get Started Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Nexari is not affiliated with DECA Inc.
        </div>
      </footer>
    </div>
  );
}
