"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function ReportPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const sections = project?.sections || [];
  const activeSection = sections.find((s: any) => s.id === activeSectionId) || sections[0];
  const activeIndex = sections.findIndex(
    (s: any) => s.id === (activeSectionId || sections[0]?.id)
  );

  const initSection = (section: any) => {
    if (!section) return;
    setActiveSectionId(section.id);
    setEditTitle(section.title);
    setEditContent(section.bodyHtml?.replace(/<[^>]*>/g, "") || "");
  };

  if (activeSection && !activeSectionId) {
    initSection(activeSection);
  }

  const saveSection = useMutation({
    mutationFn: async () => {
      await fetch(`/api/projects/${projectId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: activeSectionId || activeSection?.id,
          title: editTitle,
          bodyHtml: `<p>${editContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const getAiHelp = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sectionId: activeSectionId || activeSection?.id,
          content: `Section: ${editTitle}\nContent: ${editContent}`,
        }),
      });
      return res.json();
    },
  });

  const wordCount = editContent.split(/\s+/).filter(Boolean).length;
  const totalWords = sections.reduce((s: number, sec: any) => s + sec.wordCount, 0);

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
          <h1 className="text-lg font-bold">Written Report Editor</h1>
          <Badge variant="outline">
            ~{Math.ceil(totalWords / 250)} pages est.
            {project?.event?.maxPages ? ` / ${project.event.maxPages} max` : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => getAiHelp.mutate()}
            disabled={getAiHelp.isPending}
          >
            {getAiHelp.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            AI Feedback
          </Button>
          <Button
            size="sm"
            onClick={() => saveSection.mutate()}
            disabled={saveSection.isPending}
          >
            {saveSection.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Section List */}
        <div className="w-56 shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-2">
              {sections.map((section: any, i: number) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    (activeSectionId || sections[0]?.id) === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => initSection(section)}
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{section.title}</p>
                    <p className="text-[10px] opacity-70">
                      {section.wordCount} words
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {activeSection ? (
            <>
              <Card className="flex-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold border-none shadow-none p-0 mb-4 focus-visible:ring-0"
                    placeholder="Section Title"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 resize-none border-none shadow-none p-0 focus-visible:ring-0 text-sm leading-relaxed"
                    placeholder="Start writing your section content..."
                    rows={20}
                  />
                  <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span>~{Math.max(1, Math.ceil(wordCount / 250))} page(s)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex <= 0}
                  onClick={() => initSection(sections[activeIndex - 1])}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Section {activeIndex + 1} of {sections.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex >= sections.length - 1}
                  onClick={() => initSection(sections[activeIndex + 1])}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* AI Feedback */}
              {getAiHelp.data?.feedback && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium mb-2">AI Feedback</p>
                    <div className="space-y-2">
                      {getAiHelp.data.feedback.map((fb: any, i: number) => (
                        <div key={i} className="text-sm">
                          <Badge variant="outline" className="text-xs mr-2">
                            {fb.severity}
                          </Badge>
                          {fb.content}
                          {fb.suggestion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tip: {fb.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No sections found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
