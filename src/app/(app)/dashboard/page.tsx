"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s your DECA competition overview
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statItems.map((stat) => (
          <div key={stat.label} className="group relative flex items-center gap-3 p-4 border border-border/30 bg-card/30 backdrop-blur-sm hover:border-border/50 transition-all duration-300">
            <div className={`flex items-center justify-center w-10 h-10 ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
            {/* Corner accents */}
            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${stat.accent}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${stat.accent}`} />
          </div>
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
              <div className="relative flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40">
                <div className="flex items-center justify-center w-14 h-14 bg-muted/30 mb-4">
                  <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <h3 className="font-semibold mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                  Create your first DECA project to get started. Choose an event
                  and let AI help you build a winning submission.
                </p>
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Project
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {projects.slice(0, 5).map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex items-center justify-between p-3 -mx-3 hover:bg-accent/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-[3px] h-8 shrink-0 ${project.status === "DRAFT" ? "bg-muted-foreground/20" : "bg-primary/50"}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[10px] rounded-sm px-1.5 border-border/50">
                            {project.event?.code}
                          </Badge>
                          <Badge
                            variant={project.status === "DRAFT" ? "secondary" : "default"}
                            className="text-[10px] rounded-sm px-1.5"
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">{project.title}</p>
                        <p className="text-[11px] text-muted-foreground">{project.event?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      {project.readinessScore != null && (
                        <span className="font-mono text-[11px]">{project.readinessScore}%</span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </Link>
                ))}
                {projects.length > 5 && (
                  <Button variant="ghost" className="w-full mt-2 text-[11px]" asChild>
                    <Link href="/projects">
                      View all {projects.length} projects
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
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
                { href: "/events", icon: BookOpen, label: "Browse Events" },
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
  );
}
