"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Clock,
  Presentation,
  FileText,
  MessageSquare,
  Monitor,
  Building2,
  Lightbulb,
  DollarSign,
  Globe,
  ShoppingBag,
  Wallet,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

/* ─── Config ───────────────────────────────── */

const clusterConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; accent: string }
> = {
  BUSINESS_MANAGEMENT: {
    label: "Business Management & Administration",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-blue-400",
    accent: "border-blue-500/20",
  },
  ENTREPRENEURSHIP: {
    label: "Entrepreneurship",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-amber-400",
    accent: "border-amber-500/20",
  },
  FINANCE: {
    label: "Finance",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-green-400",
    accent: "border-green-500/20",
  },
  HOSPITALITY_TOURISM: {
    label: "Hospitality & Tourism",
    icon: <Globe className="h-5 w-5" />,
    color: "text-purple-400",
    accent: "border-purple-500/20",
  },
  MARKETING: {
    label: "Marketing",
    icon: <ShoppingBag className="h-5 w-5" />,
    color: "text-pink-400",
    accent: "border-pink-500/20",
  },
  PERSONAL_FINANCIAL_LITERACY: {
    label: "Personal Financial Literacy",
    icon: <Wallet className="h-5 w-5" />,
    color: "text-teal-400",
    accent: "border-teal-500/20",
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  PITCH_DECK: <Presentation className="h-3.5 w-3.5" />,
  WRITTEN_REPORT: <FileText className="h-3.5 w-3.5" />,
  ROLEPLAY: <MessageSquare className="h-3.5 w-3.5" />,
  ONLINE_SIMULATION: <Monitor className="h-3.5 w-3.5" />,
};

const typeLabels: Record<string, string> = {
  PITCH_DECK: "Pitch Deck",
  WRITTEN_REPORT: "Written Report",
  ROLEPLAY: "Roleplay",
  ONLINE_SIMULATION: "Online Simulation",
};

const typeColors: Record<string, string> = {
  PITCH_DECK: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  WRITTEN_REPORT: "bg-green-500/15 text-green-300 border-green-500/20",
  ROLEPLAY: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  ONLINE_SIMULATION: "bg-orange-500/15 text-orange-300 border-orange-500/20",
};

interface DecaEvent {
  id: string;
  code: string;
  name: string;
  cluster: string;
  category: string;
  eventType: string;
  teamMin: number;
  teamMax: number;
  presentationMin: number | null;
  description: string;
  hasExam: boolean;
}

/* ─── Scroll reveal hook ───────────────────── */

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

/* ─── Page ─────────────────────────────────── */

export default function PublicEventsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const initReveal = useScrollReveal();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set(Object.keys(clusterConfig))
  );

  const { data: events = [], isLoading } = useQuery<DecaEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Re-init scroll reveal after data loads (new .reveal elements appear in DOM)
  useEffect(() => {
    if (!isLoading) {
      const cleanup = initReveal(rootRef.current);
      return cleanup;
    }
  }, [isLoading, initReveal]);

  const filtered = events.filter((e) => {
    if (
      search &&
      !e.name.toLowerCase().includes(search.toLowerCase()) &&
      !e.code.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (typeFilter !== "all" && e.eventType !== typeFilter) return false;
    return true;
  });

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, DecaEvent[]>();
    const clusterOrder = Object.keys(clusterConfig);
    clusterOrder.forEach((c) => groups.set(c, []));
    filtered.forEach((e) => {
      const existing = groups.get(e.cluster) || [];
      existing.push(e);
      groups.set(e.cluster, existing);
    });
    for (const [key, value] of groups) {
      if (value.length === 0) groups.delete(key);
    }
    return groups;
  }, [filtered]);

  const toggleCluster = (cluster: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(cluster)) next.delete(cluster);
      else next.add(cluster);
      return next;
    });
  };

  const logoMaskStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
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
    <div
      ref={rootRef}
      className="min-h-screen bg-background text-foreground"
    >
      {/* ─── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/50 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0" style={logoMaskStyle} />
            <span className="font-bold text-xl tracking-tight">Nexari</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
            <Link
              href="/#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#impact"
              className="hover:text-foreground transition-colors"
            >
              Impact
            </Link>
            <Link
              href="/events"
              className="text-foreground font-medium"
            >
              Events
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-[13px] h-9"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="h-9 text-[13px]" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Hero */}
        <div className="reveal mb-12">
          <span className="text-[11px] font-mono text-primary uppercase tracking-[0.2em]">
            // Events
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-3">
            DECA Competitive Events
          </h1>
          <p className="text-muted-foreground mt-4 text-[15px] max-w-2xl">
            Browse all {events.length > 0 ? events.length : ""} competitive
            events organized by career cluster. Pick an event to start building
            your project with AI assistance.
          </p>
        </div>

        {/* Filters */}
        <div className="reveal flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-card/30 border-border/40"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v || "all")}
          >
            <SelectTrigger className="w-full sm:w-52 h-10 bg-card/30 border-border/40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border/40"
              onClick={() =>
                setExpandedClusters(new Set(Object.keys(clusterConfig)))
              }
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border/40"
              onClick={() => setExpandedClusters(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>

        <div className="gradient-line mb-8" />

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-border/30 rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-28 bg-muted/20 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cluster groups */}
        {!isLoading && (
          <div className="space-y-4">
            {Array.from(groupedEvents.entries()).map(
              ([cluster, clusterEvents]) => {
                const config = clusterConfig[cluster];
                const isExpanded = expandedClusters.has(cluster);
                return (
                  <div
                    key={cluster}
                    className={`reveal rounded-lg border ${config?.accent || "border-border/30"} bg-card/20 backdrop-blur-sm overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleCluster(cluster)}
                      className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={config?.color}>
                          {config?.icon}
                        </span>
                        <div className="text-left">
                          <h2 className="font-semibold text-[15px]">
                            {config?.label || cluster}
                          </h2>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            {clusterEvents.length} event
                            {clusterEvents.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 md:px-5 pb-4 md:pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clusterEvents.map((event) => (
                          <Link
                            key={event.id}
                            href="/login"
                            className="group block"
                          >
                            <div className="h-full p-4 rounded-lg border border-border/30 bg-background/60 hover:border-primary/30 hover:bg-accent/10 transition-all duration-300">
                              {/* Header row */}
                              <div className="flex items-center justify-between mb-2.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] rounded-sm px-1.5 border-border/50 font-mono"
                                >
                                  {event.code}
                                </Badge>
                                <Badge
                                  className={`text-[10px] rounded-sm px-1.5 border ${typeColors[event.eventType] || ""}`}
                                >
                                  <span className="mr-1">
                                    {typeIcons[event.eventType]}
                                  </span>
                                  {typeLabels[event.eventType]}
                                </Badge>
                              </div>

                              {/* Title */}
                              <h3 className="font-semibold text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors">
                                {event.name}
                              </h3>

                              {/* Description */}
                              <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                                {event.description}
                              </p>

                              {/* Meta */}
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.teamMin === event.teamMax
                                    ? `${event.teamMin}`
                                    : `${event.teamMin}-${event.teamMax}`}
                                </span>
                                {event.presentationMin && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.presentationMin}m
                                  </span>
                                )}
                                {event.hasExam && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0 px-1.5 rounded-sm"
                                  >
                                    Exam
                                  </Badge>
                                )}
                                <ArrowRight className="h-3 w-3 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No events match your filters.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="reveal mt-16 text-center">
          <div className="gradient-line mb-12" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em]">
            Ready to Start Competing?
          </h2>
          <p className="text-muted-foreground mt-3 text-[15px] max-w-md mx-auto">
            Sign up to pick an event and build your project with AI-powered
            guidance.
          </p>
          <Button size="lg" className="mt-6 group h-11 px-8" asChild>
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </main>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-[18px] h-[18px] shrink-0 opacity-30"
              style={logoMaskStyle}
            />
            <span className="text-[11px] text-muted-foreground/60">
              Nexari
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Nexari is not affiliated with DECA Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
