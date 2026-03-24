"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Download,
  Sparkles,
  Lightbulb,
  Loader2,
  AlertTriangle,
  Upload,
  X,
  Pencil,
  Check,
  Search,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export default function ProjectDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      return res.json();
    },
  });

  const runCompliance = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const text = await res.text();
      const data = JSON.parse(text.trim());
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const renameProject = useMutation({
    mutationFn: async (newTitle: string) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      return res.json();
    },
    onSuccess: () => {
      setIsEditingTitle(false);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const removeFile = useMutation({
    mutationFn: async () => {
      await fetch(`/api/projects/${projectId}/upload`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!project) return <p>Project not found.</p>;

  const isPitchDeck = project.event.eventType === "PITCH_DECK";
  const compliance = project.complianceJson as any;

  const workflowSteps = [
    {
      id: "idea",
      title: "Define Your Business Idea",
      description: "Brainstorm and select a business concept for your project",
      link: `/projects/${projectId}/idea`,
      isComplete: !!project.businessIdea,
      icon: Sparkles,
      color: "text-purple-500",
    },
    {
      id: "research",
      title: "Research Your Topic",
      description: "Use AI-powered templates to gather market data, competitor info, and more",
      link: `/projects/${projectId}/research`,
      isComplete: (project.research || []).some((r: any) => r.status === "COMPLETED"),
      icon: Search,
      color: "text-blue-500",
    },
    {
      id: "plan",
      title: "Create a Plan",
      description: "Generate a daily schedule with milestones to stay on track",
      link: `/planner`,
      isComplete: false,
      icon: Calendar,
      color: "text-teal-500",
    },
    {
      id: "build",
      title: isPitchDeck ? "Build Your Pitch Deck" : "Write Your Report",
      description: isPitchDeck
        ? "Create your pitch deck externally, then upload it for review"
        : "Write each section of your report using the editor",
      link: isPitchDeck
        ? `/projects/${projectId}/presentation`
        : `/projects/${projectId}/report`,
      isComplete: isPitchDeck
        ? !!project.uploadedFileName
        : (project.sections || []).some((s: any) => s.wordCount > 10),
      icon: FileText,
      color: "text-green-500",
    },
    {
      id: "feedback",
      title: "Get AI Feedback",
      description: "Have AI review your work and suggest improvements",
      link: `/projects/${projectId}/feedback`,
      isComplete: (project.feedback || []).length > 0,
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      id: "compliance",
      title: "Check Compliance",
      description: "Verify your project meets all DECA guidelines",
      link: `/projects/${projectId}/compliance`,
      isComplete: !!project.complianceJson,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: "judge",
      title: "Practice with Judge Sim",
      description: "Get a simulated judge score to see how you'd perform",
      link: `/projects/${projectId}/judge`,
      isComplete: (project.scores || []).length > 0,
      icon: BarChart3,
      color: "text-red-500",
    },
  ];

  const firstIncompleteIndex = workflowSteps.findIndex((s) => !s.isComplete);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editTitle.trim()) renameProject.mutate(editTitle.trim());
                  }}
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-bold h-9 w-64"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={renameProject.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors group flex items-center gap-2"
                  onClick={() => {
                    setEditTitle(project.title);
                    setIsEditingTitle(true);
                  }}
                >
                  {project.title}
                  <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </h1>
              )}
              <Badge variant="outline">{project.event.code}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{project.event.name}</p>
          </div>
        </div>
      </div>

      {/* Business Idea */}
      {project.businessIdea && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1">Business Idea</p>
            <p className="text-sm text-muted-foreground">{project.businessIdea}</p>
          </CardContent>
        </Card>
      )}

      {/* Guided Workflow Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Project Roadmap</CardTitle>
          <CardDescription>Follow these steps to build a winning DECA project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              const isCurrent = i === firstIncompleteIndex;
              return (
                <Link key={step.id} href={step.link}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-primary/5 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className={`flex items-center justify-center h-7 w-7 rounded-full shrink-0 ${
                      step.isComplete
                        ? "bg-green-100 dark:bg-green-950/30"
                        : isCurrent
                        ? "bg-primary/10"
                        : "bg-muted"
                    }`}>
                      {step.isComplete ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Icon className={`h-4 w-4 ${isCurrent ? step.color : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.isComplete ? "text-muted-foreground" : ""}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    {isCurrent && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Next <ArrowRight className="h-3 w-3 ml-1" />
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href={`/projects/${projectId}/presentation`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Upload className="h-6 w-6 text-indigo-500" />
              <span className="text-xs font-medium">My Presentation</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/research`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Search className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-medium">Research</span>
            </CardContent>
          </Card>
        </Link>
        {!isPitchDeck && (
          <Link href={`/projects/${projectId}/report`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <FileText className="h-6 w-6 text-green-500" />
                <span className="text-xs font-medium">Edit Report</span>
              </CardContent>
            </Card>
          </Link>
        )}
        <Link href={`/projects/${projectId}/idea`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <span className="text-xs font-medium">AI Ideas</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/feedback`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <MessageSquare className="h-6 w-6 text-orange-500" />
              <span className="text-xs font-medium">AI Feedback</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/tips`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-500" />
              <span className="text-xs font-medium">Tips</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/compliance`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-xs font-medium">Compliance</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/judge`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <BarChart3 className="h-6 w-6 text-red-500" />
              <span className="text-xs font-medium">Judge Sim</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/export`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Download className="h-6 w-6 text-gray-500" />
              <span className="text-xs font-medium">Export</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upload Presentation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">
                  {project.uploadedFileName
                    ? `Uploaded: ${project.uploadedFileName}`
                    : "Upload Your Presentation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.uploadedFileName
                    ? "AI will use this file for feedback, compliance checks, and judge scoring"
                    : "Upload a PDF or PPTX so AI can review your actual presentation"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {project.uploadedFileName && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile.mutate()}
                  disabled={removeFile.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile.mutate(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFile.isPending}
              >
                {uploadFile.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1" /> {project.uploadedFileName ? "Replace" : "Upload"}</>
                )}
              </Button>
            </div>
          </div>
          {uploadFile.isError && (
            <p className="text-xs text-red-500 mt-2">
              {(uploadFile.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Content Overview & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isPitchDeck ? "Research Progress" : "Report Sections"}
            </CardTitle>
            <CardDescription>
              {isPitchDeck
                ? `${(project.research || []).filter((r: any) => r.status === "COMPLETED").length} / ${(project.research || []).length} research completed`
                : `${project.sections.length} sections`}
              {!isPitchDeck && project.event.maxPages
                ? ` / ${project.event.maxPages} max pages`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isPitchDeck
                ? (project.research || []).map((doc: any, i: number) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted">
                      <span className="text-muted-foreground w-6">{i + 1}</span>
                      <span className="flex-1">{doc.title}</span>
                      {doc.status === "COMPLETED" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </div>
                  ))
                : project.sections.map((section: any, i: number) => (
                    <div key={section.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted">
                      <span className="text-muted-foreground w-6">{i + 1}</span>
                      <span className="flex-1">{section.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {section.wordCount} words
                      </span>
                      {section.wordCount > 10 ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Status</CardTitle>
            <CardDescription>
              Does your project meet DECA guidelines?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {compliance ? (
              <>
                {(() => {
                  const checks = compliance.checks || [];
                  const failedCount = checks.filter((c: any) => !c.passed).length;
                  const allCompliant = failedCount === 0;
                  return (
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${allCompliant ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20"}`}>
                      {allCompliant ? (
                        <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium">
                        {allCompliant ? "All Guidelines Met" : `${failedCount} issue${failedCount > 1 ? "s" : ""} found`}
                      </span>
                    </div>
                  );
                })()}
                <div className="space-y-1.5">
                  {[...(compliance.checks || [])].sort((a: any, b: any) => Number(a.passed) - Number(b.passed)).slice(0, 5).map((check: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.passed ? (
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className={`h-3 w-3 shrink-0 ${
                          check.severity === "error" ? "text-red-500" : "text-yellow-500"
                        }`} />
                      )}
                      <span className="text-muted-foreground">{check.message}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Run a compliance check to verify your project meets DECA guidelines
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => runCompliance.mutate()}
              disabled={runCompliance.isPending}
            >
              {runCompliance.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Run Compliance Check</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {project.feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent AI Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.feedback.slice(0, 5).map((fb: any) => (
                <div key={fb.id} className="flex items-start gap-2 text-sm p-2 rounded border">
                  <Badge
                    variant={
                      fb.severity === "ERROR" ? "destructive" : fb.severity === "WARNING" ? "secondary" : "outline"
                    }
                    className="text-xs shrink-0"
                  >
                    {fb.feedbackType.replace("_", " ")}
                  </Badge>
                  <p className="text-muted-foreground">{fb.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
