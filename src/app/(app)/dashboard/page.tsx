"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FloatingCard } from "@/components/ui/floating-card";
import { ProjectListItem } from "@/components/projects/ProjectListItem";
import { NexWelcome } from "@/components/nex/NexWelcome";
import { NexChatbot } from "@/components/nex/NexChatbot";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Trophy,
  Flame,
  BookOpen,
  ArrowRight,
  Sparkles,
  Mic,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["planner"],
    queryFn: async () => {
      const res = await fetch("/api/planner");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streakDays ?? 0;
  const badgeCount = profile?.badges?.length ?? 0;
  const xpForNextLevel = level * 100;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayTasks = tasks.filter((t: any) => {
    if (!t.dueDate || t.completed) return false;
    const d = new Date(t.dueDate);
    const taskDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return taskDate === today;
  });

  const statItems = [
    {
      icon: FolderOpen,
      value: projects.length,
      label: "Projects",
      color: "text-blue-400",
      bg: "bg-blue-500/8",
      accent: "border-blue-500/10",
    },
    {
      icon: Sparkles,
      value: xp,
      label: "XP Earned",
      color: "text-purple-400",
      bg: "bg-purple-500/8",
      accent: "border-purple-500/10",
    },
    {
      icon: Flame,
      value: streak,
      label: "Day Streak",
      color: "text-orange-400",
      bg: "bg-orange-500/8",
      accent: "border-orange-500/10",
    },
    {
      icon: Trophy,
      value: badgeCount,
      label: "Badges",
      color: "text-amber-400",
      bg: "bg-amber-500/8",
      accent: "border-amber-500/10",
    },
  ];

  // Nex messages based on user state
  const nexMessages = projects.length === 0 ? [
    {
      id: "welcome",
      text: "👋 Hi! I'm Nex, your AI assistant. I'm here to help you create amazing DECA projects! Let me show you around.",
      actions: [
        {
          label: "Start First Project",
          onClick: () => router.push("/projects/new"),
          variant: "primary" as const
        },
        {
          label: "Browse Events",
          onClick: () => router.push("/events"),
          variant: "outline" as const
        }
      ]
    },
    {
      id: "tips",
      text: "💡 Pro tip: Start with the idea generator! I can help you brainstorm unique business concepts tailored to your chosen DECA event.",
    },
    {
      id: "guide",
      text: "📚 I'll guide you through every step: from ideation to pitch deck creation, compliance checking, and even judge simulation!",
    }
  ] : [
    {
      id: "progress",
      text: `Great progress! You have ${projects.length} project${projects.length > 1 ? 's' : ''} underway. What would you like to work on today?`,
      actions: projects.slice(0, 2).map((p: any) => ({
        label: p.title,
        onClick: () => router.push(`/projects/${p.id}`),
        variant: "outline" as const
      }))
    },
    {
      id: "streak",
      text: streak > 0 ? `🔥 You're on a ${streak} day streak! Keep it up!` : "💪 Ready to start a new streak? Consistency is key to DECA success!",
    }
  ];

  return (
    <>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Nex Welcome Card */}
        <NexWelcome
          userName={session?.user?.name || undefined}
          projectCount={projects.length}
          currentStreak={streak}
        />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <FloatingCard key={stat.label} className="group relative flex items-center gap-3 p-5">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
            {/* Gradient accent */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.bg} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none`} />
          </FloatingCard>
        ))}
      </div>

      <div className="gradient-line" />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Projects + Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono text-primary uppercase tracking-[0.18em]">// Projects</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects" className="text-[11px] text-muted-foreground hover:text-foreground">
                  View All
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            </div>

            {projects.length === 0 ? (
              <FloatingCard variant="ghost" className="relative flex flex-col items-center justify-center py-16 text-center border-dashed">
                <div className="flex items-center justify-center w-14 h-14 bg-muted/30 rounded-xl mb-4">
                  <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <h3 className="font-semibold mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                  Create your first DECA project to get started. Choose an event
                  and let AI help you build a winning submission.
                </p>
                <LiquidMetalButton
                  label="Create Your First Project"
                  onClick={() => router.push('/projects/new')}
                />
              </FloatingCard>
            ) : (
              <FloatingCard className="divide-y divide-border/30 p-0 overflow-hidden">
                {projects.slice(0, 5).map((project: any) => (
                  <ProjectListItem key={project.id} project={project} />
                ))}
              </FloatingCard>
            )}
            {projects.length > 5 && (
              <Button variant="ghost" className="w-full mt-2 text-[11px]" asChild>
                <Link href="/projects">
                  View all {projects.length} projects
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </section>

          <div className="gradient-line" />

          {/* Today's Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono text-primary uppercase tracking-[0.18em]">// Today&apos;s Tasks</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/planner" className="text-[11px] text-muted-foreground hover:text-foreground">
                  View All
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            </div>

            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No tasks scheduled for today. Head to the planner to add some!
              </p>
            ) : (
              <div className="space-y-1.5">
                {todayTasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 text-sm py-1.5 group">
                    <div className="w-[3px] h-[3px] bg-primary/50 rotate-45 shrink-0" />
                    <span className="truncate group-hover:text-foreground transition-colors">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Level Progress */}
          <section>
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.18em]">// Level Progress</span>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Level {level}</span>
                <span className="text-muted-foreground font-mono text-[11px]">{xp} / {xpForNextLevel} XP</span>
              </div>
              <Progress value={xpProgress} />
              <p className="text-[11px] text-muted-foreground">
                {xpForNextLevel - xp} XP to next level
              </p>
            </div>
          </section>

          <div className="gradient-line" />

          {/* Quick Actions */}
          <section>
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.18em]">// Quick Actions</span>
            <div className="mt-4 space-y-0.5">
              {[
                { href: "/event-catalog", icon: BookOpen, label: "Browse Events" },
                { href: "/projects/new", icon: Plus, label: "New Project" },
                { href: "/roleplay", icon: Mic, label: "Practice Roleplay" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 px-3 py-2.5 -mx-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all"
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  <span>{action.label}</span>
                  <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </section>

          <div className="gradient-line" />

          {/* Badges */}
          <section>
            <span className="text-[11px] font-mono text-primary uppercase tracking-[0.18em]">// Badges</span>
            <div className="mt-4">
              {badgeCount === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Complete tasks to earn your first badge!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile?.badges ?? []).slice(0, 6).map((ub: any) => (
                    <div
                      key={ub.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/30 text-[11px] border border-border/30"
                      title={ub.badge?.description}
                    >
                      <span>{ub.badge?.icon}</span>
                      <span>{ub.badge?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      </div>

      {/* Nex Chatbot */}
      <NexChatbot position="bottom-right" />
    </>
  );
}
