"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Presentation,
  FileText,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Download,
  Sparkles,
  Loader2,
  AlertTriangle,
  Upload,
  X,
  Pencil,
  Check,
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
      return res.json();
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Link href={`/projects/${projectId}/presentation`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Upload className="h-6 w-6 text-indigo-500" />
              <span className="text-xs font-medium">My Presentation</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/${isPitchDeck ? "slides" : "report"}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              {isPitchDeck ? (
                <Presentation className="h-6 w-6 text-blue-500" />
              ) : (
                <FileText className="h-6 w-6 text-green-500" />
              )}
              <span className="text-xs font-medium">
                {isPitchDeck ? "Edit Slides" : "Edit Report"}
              </span>
            </CardContent>
          </Card>
        </Link>
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
              {isPitchDeck ? "Slides" : "Report Sections"}
            </CardTitle>
            <CardDescription>
              {isPitchDeck
                ? `${project.slides.length} slides`
                : `${project.sections.length} sections`}
              {project.event.maxSlides && isPitchDeck
                ? ` / ${project.event.maxSlides} max`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isPitchDeck
                ? project.slides.map((slide: any, i: number) => (
                    <div key={slide.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted">
                      <span className="text-muted-foreground w-6">{i + 1}</span>
                      <span className="flex-1">{slide.title}</span>
                      {(() => {
                        const content = slide.contentJson as any;
                        const hasContent = content?.blocks?.some(
                          (b: any) => b.content && b.content.trim().length > 0
                        );
                        return hasContent ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                        );
                      })()}
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

        {/* Compliance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DECA Readiness</CardTitle>
            <CardDescription>
              How well your project meets DECA requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {compliance ? (
              <>
                <div className="text-center">
                  <span className="text-4xl font-bold">{compliance.score}</span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={compliance.score} />
                <div className="space-y-1.5">
                  {(compliance.checks || []).slice(0, 5).map((check: any, i: number) => (
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
                  Run a compliance check to see your readiness score
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
