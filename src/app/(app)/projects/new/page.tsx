"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  Building2,
  Lightbulb,
  DollarSign,
  Globe,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { GeneratedIdea } from "@/types/deca";

const clusterConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUSINESS_MANAGEMENT: { label: "Business Management & Administration", icon: <Building2 className="h-5 w-5" />, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  ENTREPRENEURSHIP: { label: "Entrepreneurship", icon: <Lightbulb className="h-5 w-5" />, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  FINANCE: { label: "Finance", icon: <DollarSign className="h-5 w-5" />, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
  HOSPITALITY_TOURISM: { label: "Hospitality & Tourism", icon: <Globe className="h-5 w-5" />, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
  MARKETING: { label: "Marketing", icon: <ShoppingBag className="h-5 w-5" />, color: "from-pink-500/20 to-pink-600/10 border-pink-500/30" },
  PERSONAL_FINANCIAL_LITERACY: { label: "Personal Financial Literacy", icon: <Wallet className="h-5 w-5" />, color: "from-teal-500/20 to-teal-600/10 border-teal-500/30" },
};

const typeLabels: Record<string, string> = {
  PITCH_DECK: "Pitch Deck",
  WRITTEN_REPORT: "Written Report",
  ROLEPLAY: "Roleplay",
  ONLINE_SIMULATION: "Online Simulation",
};

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <NewProjectContent />
    </Suspense>
  );
}

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [step, setStep] = useState(preselectedEventId ? 3 : 1);
  const [selectedCluster, setSelectedCluster] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || "");
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Show all events
  const preparedEvents = events;

  // Get unique clusters with event counts
  const clusters = useMemo(() => {
    const clusterMap = new Map<string, number>();
    preparedEvents.forEach((e: any) => {
      clusterMap.set(e.cluster, (clusterMap.get(e.cluster) || 0) + 1);
    });
    return Array.from(clusterMap.entries()).map(([cluster, count]) => ({
      cluster,
      count,
      ...clusterConfig[cluster],
    }));
  }, [preparedEvents]);

  // Filter events by selected cluster
  const clusterEvents = useMemo(
    () => preparedEvents.filter((e: any) => e.cluster === selectedCluster),
    [preparedEvents, selectedCluster]
  );

  const selectedEvent = events.find((e: any) => e.id === selectedEventId);

  // If preselected, set the cluster from the event
  useMemo(() => {
    if (preselectedEventId && selectedEvent && !selectedCluster) {
      setSelectedCluster(selectedEvent.cluster);
    }
  }, [preselectedEventId, selectedEvent, selectedCluster]);

  const generateIdeas = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/generate-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          prompt: customPrompt || undefined,
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text.trim());
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setIdeas(data.ideas || []);
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle || selectedIdea?.name || "Untitled Project",
          eventId: selectedEventId,
          businessIdea: selectedIdea?.pitch,
          ideaJson: selectedIdea,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create project");
      return data;
    },
    onSuccess: (data) => {
      router.push(`/projects/${data.id}`);
    },
  });

  const totalSteps = 4;
  const stepLabels = ["Select Cluster", "Select Event", "Generate Ideas", "Create Project"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-muted-foreground text-sm">
            Step {step} of {totalSteps} — {stepLabels[step - 1]}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i + 1 <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Cluster */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Choose your career cluster</h2>
          <p className="text-sm text-muted-foreground">Select the area that interests you most</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clusters.map((c) => (
              <Card
                key={c.cluster}
                className={`cursor-pointer transition-all bg-gradient-to-br ${c.color} ${
                  selectedCluster === c.cluster
                    ? "ring-2 ring-primary"
                    : "hover:ring-1 hover:ring-primary/50"
                }`}
                onClick={() => setSelectedCluster(c.cluster)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {c.icon}
                      <span className="font-medium text-sm">{c.label}</span>
                    </div>
                    {selectedCluster === c.cluster && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.count} event{c.count !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            onClick={() => setStep(2)}
            disabled={!selectedCluster}
            className="w-full"
          >
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Select Event within Cluster */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              Choose your event
            </h2>
            <Badge variant="outline" className="text-xs">
              {clusterConfig[selectedCluster]?.label}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clusterEvents.map((event: any) => (
              <Card
                key={event.id}
                className={`cursor-pointer transition-all ${
                  selectedEventId === event.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedEventId(event.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{event.code}</Badge>
                    {selectedEventId === event.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="font-medium text-sm">{event.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeLabels[event.eventType] || event.eventType}
                    {event.teamMax > 1 && ` · ${event.teamMin}-${event.teamMax} members`}
                    {event.presentationMin && ` · ${event.presentationMin} min`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep(1); setSelectedEventId(""); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedEventId}
              className="flex-1"
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generate Ideas */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">
              Generate ideas for {selectedEvent?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Let AI brainstorm business ideas for you, or describe your interests below
            </p>
          </div>

          <Textarea
            placeholder="Optional: describe your interests, target market, or any constraints (e.g., 'I'm interested in sustainability and Gen Z consumers')"
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
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating ideas...
              </>
            ) : ideas.length > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Ideas
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Ideas with AI
              </>
            )}
          </Button>

          {ideas.length > 0 && (
            <div className="space-y-3">
              {ideas.map((idea, i) => (
                <Card
                  key={i}
                  className={`cursor-pointer transition-all ${
                    selectedIdea === idea
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedIdea(idea);
                    setProjectTitle(idea.name);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{idea.name}</CardTitle>
                      {selectedIdea === idea && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <CardDescription>{idea.pitch}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><strong>Problem:</strong> {idea.problem}</p>
                    <p><strong>Target Market:</strong> {idea.targetMarket}</p>
                    <p><strong>Revenue:</strong> {idea.revenueModel}</p>
                    <p><strong>Unique Factor:</strong> {idea.uniqueness}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!selectedIdea}
              className="flex-1"
            >
              Continue with Selected Idea <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              setSelectedIdea(null);
              setStep(4);
            }}
          >
            Skip — I already have an idea
          </Button>
        </div>
      )}

      {/* Step 4: Create Project */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Name your project</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Title</label>
            <Input
              placeholder="Enter your project name"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </div>

          {selectedIdea && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-1">Selected Idea</p>
                <p className="text-sm text-muted-foreground">{selectedIdea.pitch}</p>
              </CardContent>
            </Card>
          )}

          {createProject.isError && (
            <p className="text-sm text-red-500 text-center">
              {(createProject.error as Error).message}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => createProject.mutate()}
              disabled={createProject.isPending || !projectTitle}
              className="flex-1"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
