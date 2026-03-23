"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Save,
  CheckCircle,
  Circle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RESEARCH_TEMPLATES } from "@/lib/research-templates";

const statusConfig: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-500" },
  COMPLETED: { label: "Completed", color: "text-green-500" },
};

export default function ResearchPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const docs = project?.research || [];
  const activeDoc =
    docs.find((d: any) => d.id === activeDocId) || docs[0] || null;

  const template = activeDoc
    ? RESEARCH_TEMPLATES.find((t) => t.key === activeDoc.template)
    : null;

  const initDoc = (doc: any) => {
    setActiveDocId(doc.id);
    const content = doc.contentJson || {};
    if (content.sections && content.sections.length > 0) {
      setEditContent(
        content.sections
          .map((s: any) => `## ${s.heading}\n\n${s.content}`)
          .join("\n\n")
      );
    } else {
      setEditContent("");
    }
    setCustomPrompt("");
  };

  if (docs.length > 0 && !activeDocId) {
    initDoc(docs[0]);
  }

  const generateResearch = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          researchId: activeDoc?.id,
          userPrompt: customPrompt || undefined,
        }),
      });
      const text = await res.text();
      const trimmed = text.replace(/^\s+/, "").trim();
      const jsonStart = trimmed.indexOf("{");
      if (jsonStart === -1)
        throw new Error("Failed to parse research response");
      const data = JSON.parse(trimmed.substring(jsonStart));
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      if (data.sections) {
        setEditContent(
          data.sections
            .map((s: any) => `## ${s.heading}\n\n${s.content}`)
            .join("\n\n")
        );
      }
    },
  });

  const saveResearch = useMutation({
    mutationFn: async () => {
      if (!activeDoc) return;
      // Parse markdown-style content back into sections
      const sectionRegex = /## (.+?)\n\n([\s\S]*?)(?=\n## |$)/g;
      const sections: { heading: string; content: string }[] = [];
      let match;
      while ((match = sectionRegex.exec(editContent)) !== null) {
        sections.push({ heading: match[1].trim(), content: match[2].trim() });
      }
      // If no sections parsed, store as single section
      if (sections.length === 0 && editContent.trim()) {
        sections.push({ heading: activeDoc.title, content: editContent.trim() });
      }

      const existing = activeDoc.contentJson || {};
      const contentJson = {
        ...existing,
        sections,
      };

      await fetch(`/api/projects/${projectId}/research`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researchId: activeDoc.id,
          contentJson,
          status: editContent.trim() ? "COMPLETED" : "NOT_STARTED",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const completedCount = docs.filter(
    (d: any) => d.status === "COMPLETED"
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold">Research</h1>
          <Badge variant="outline">
            {completedCount} / {docs.length} completed
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateResearch.mutate()}
            disabled={generateResearch.isPending || !activeDoc}
          >
            {generateResearch.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {activeDoc?.status === "COMPLETED"
              ? "Regenerate"
              : "Generate with AI"}
          </Button>
          <Button
            size="sm"
            onClick={() => saveResearch.mutate()}
            disabled={saveResearch.isPending || !activeDoc}
          >
            {saveResearch.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Template List (Left Panel) */}
        <div className="w-56 shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-2">
              {docs.map((doc: any) => {
                const status = statusConfig[doc.status] || statusConfig.NOT_STARTED;
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      (activeDocId || docs[0]?.id) === doc.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => initDoc(doc)}
                  >
                    {doc.status === "COMPLETED" ? (
                      <CheckCircle className="h-3 w-3 shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{doc.title}</p>
                      <p className={`text-[10px] ${
                        (activeDocId || docs[0]?.id) === doc.id
                          ? "opacity-70"
                          : status.color
                      }`}>
                        {status.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {activeDoc ? (
            <>
              {/* Guidance Panel */}
              {template && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <button
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => setShowGuide(!showGuide)}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {template.title} — Guidelines
                        </span>
                      </div>
                      {showGuide ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {showGuide && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div>
                          <p className="text-xs font-medium mb-1">
                            Guiding Questions:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {template.guidingQuestions.map((q, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-muted-foreground/50 mt-0.5">
                                  •
                                </span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Custom Prompt */}
              <Textarea
                placeholder="Optional: add specific questions or context for AI research (e.g., 'Focus on the eco-friendly packaging market in the US')"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                className="text-sm"
              />

              {/* Research Content Editor */}
              <Card className="flex-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 resize-none border-none shadow-none p-0 focus-visible:ring-0 text-sm leading-relaxed"
                    placeholder="Research content will appear here after AI generation. You can also write your own research notes..."
                    rows={20}
                  />
                </CardContent>
              </Card>

              {/* Key Insights (if generated) */}
              {activeDoc.contentJson?.keyInsights &&
                activeDoc.contentJson.keyInsights.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium mb-2">Key Insights</p>
                      <ul className="space-y-1">
                        {activeDoc.contentJson.keyInsights.map(
                          (insight: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-1.5"
                            >
                              <span className="text-blue-500 mt-0.5">•</span>
                              {insight}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* Key Sources (if generated) */}
              {activeDoc.contentJson?.keySources &&
                activeDoc.contentJson.keySources.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium mb-2">
                        Suggested Sources
                      </p>
                      <ul className="space-y-1">
                        {activeDoc.contentJson.keySources.map(
                          (source: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              {i + 1}. {source}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* Error */}
              {generateResearch.isError && (
                <p className="text-sm text-red-500 text-center">
                  {(generateResearch.error as Error).message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No research templates found. Try creating a new project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
