"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Check } from "lucide-react";

export default function IdeaPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [customPrompt, setCustomPrompt] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const generateIdeas = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/generate-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: project.eventId,
          prompt: customPrompt || undefined,
        }),
      });
      return res.json();
    },
  });

  const selectIdea = useMutation({
    mutationFn: async (idea: any) => {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessIdea: idea.pitch,
          ideaJson: idea,
          title: idea.name,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const ideas = generateIdeas.data?.ideas || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">AI Idea Generator</h1>
          <p className="text-muted-foreground text-sm">
            Generate and refine business ideas for {project?.event?.name}
          </p>
        </div>
      </div>

      {project?.businessIdea && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-1">Current Idea</p>
            <p className="text-sm">{project.businessIdea}</p>
          </CardContent>
        </Card>
      )}

      <Textarea
        placeholder="Optional: describe your interests or constraints..."
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        rows={3}
      />

      <Button
        onClick={() => generateIdeas.mutate()}
        disabled={generateIdeas.isPending}
        className="w-full"
      >
        {generateIdeas.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
        ) : ideas.length > 0 ? (
          <><RefreshCw className="h-4 w-4 mr-2" /> Regenerate Ideas</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" /> Generate Ideas</>
        )}
      </Button>

      {ideas.length > 0 && (
        <div className="space-y-3">
          {ideas.map((idea: any, i: number) => (
            <Card key={i} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{idea.name}</CardTitle>
                <CardDescription>{idea.pitch}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Problem:</strong> {idea.problem}</p>
                <p><strong>Target:</strong> {idea.targetMarket}</p>
                <p><strong>Revenue:</strong> {idea.revenueModel}</p>
                <p><strong>Unique:</strong> {idea.uniqueness}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => selectIdea.mutate(idea)}
                  disabled={selectIdea.isPending}
                >
                  <Check className="h-3 w-3 mr-1" /> Use This Idea
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
