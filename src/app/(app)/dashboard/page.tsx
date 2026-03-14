"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageSquare,
  BarChart3,
  Mic,
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

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(
    (t: any) => t.dueDate && t.dueDate.split("T")[0] === today && !t.completed
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your DECA competition overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
                <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{xp}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{badgeCount}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Projects</CardTitle>
                  <CardDescription>Start building your DECA project</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Create your first DECA project to get started. Choose an event
                    and let AI help you build a winning submission.
                  </p>
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project: any) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="text-xs">
                              {project.event?.code}
                            </Badge>
                            <Badge
                              variant={project.status === "DRAFT" ? "secondary" : "default"}
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm truncate">{project.title}</p>
                          <p className="text-xs text-muted-foreground">{project.event?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        {project.readinessScore != null && (
                          <span>{project.readinessScore}% ready</span>
                        )}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                  {projects.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/projects">
                        View all {projects.length} projects
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today&apos;s Tasks</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/planner">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No tasks scheduled for today. Head to the planner to add some!
                </p>
              ) : (
                <div className="space-y-2">
                  {todayTasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Level Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Level {level}</span>
                  <span className="text-muted-foreground">{xp} / {xpForNextLevel} XP</span>
                </div>
                <Progress value={xpProgress} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/events">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Events
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/roleplay">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Practice Roleplay
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {badgeCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete tasks to earn your first badge!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile?.badges ?? []).slice(0, 6).map((ub: any) => (
                    <div
                      key={ub.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs"
                      title={ub.badge?.description}
                    >
                      <span>{ub.badge?.icon}</span>
                      <span>{ub.badge?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
