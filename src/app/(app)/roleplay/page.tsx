"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Loader2,
  RefreshCw,
  Send,
  Trophy,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function RoleplayPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [step, setStep] = useState<"select" | "scenario" | "feedback">("select");
  const [scenario, setScenario] = useState("");
  const [kpis, setKpis] = useState<string[]>([]);
  const [response, setResponse] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      return res.json();
    },
  });

  const roleplayEvents = events.filter((e: any) => e.eventType === "ROLEPLAY");

  const generateScenario = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_scenario",
          eventCode: selectedEvent,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setScenario(data.scenario || "");
      setKpis(data.kpis || []);
      setStep("scenario");
    },
  });

  const submitResponse = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_response",
          eventCode: selectedEvent,
          scenario,
          kpis,
          response,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      setStep("feedback");
    },
  });

  const feedback = submitResponse.data;

  const handleTryAgain = (newScenario: boolean) => {
    setResponse("");
    if (newScenario) {
      generateScenario.mutate();
    } else {
      setStep("scenario");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Roleplay Practice</h1>
        <p className="text-muted-foreground">
          Practice your DECA roleplay events — write what you&apos;d say and get AI feedback
        </p>
      </div>

      {/* Step 1: Select Event */}
      {step === "select" && (
        <div className="space-y-4">
          <h2 className="font-semibold">Select an Event</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roleplayEvents.map((event: any) => (
              <Card
                key={event.code}
                className={`cursor-pointer transition-all ${
                  selectedEvent === event.code
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedEvent(event.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{event.code}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {event.teamMin === 1 ? "Individual" : "Team"}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{event.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.prepMin} min prep · {event.presentationMin} min present
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => generateScenario.mutate()}
            disabled={!selectedEvent || generateScenario.isPending}
          >
            {generateScenario.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating scenario...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Roleplay Scenario</>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: Scenario + Write Response */}
      {step === "scenario" && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStep("select"); setScenario(""); setKpis([]); setResponse(""); }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Events
          </Button>

          <Card className="bg-muted/50 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">Your Scenario</CardTitle>
              </div>
              <CardDescription>
                Read the scenario below, then write what you would say to the judge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{scenario}</p>
            </CardContent>
          </Card>

          {/* KPIs */}
          {kpis.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" /> Key Performance Indicators (KPIs)
                </CardTitle>
                <CardDescription>
                  The judge will evaluate your response on these 4 KPIs — each worth 25 points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {kpis.map((kpi, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{kpi}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Response</label>
            <p className="text-xs text-muted-foreground">
              Write everything you would say to the judge — your presentation, answers, and key points
            </p>
            <Textarea
              placeholder="Type what you would say in this roleplay scenario..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={12}
              className="text-sm"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{response.split(/\s+/).filter(Boolean).length} words</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateScenario.mutate()}
                disabled={generateScenario.isPending}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> New Scenario
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => submitResponse.mutate()}
            disabled={!response.trim() || submitResponse.isPending}
          >
            {submitResponse.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evaluating your response...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Submit for AI Feedback</>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Feedback */}
      {step === "feedback" && feedback && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStep("select"); setScenario(""); setKpis([]); setResponse(""); }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Events
          </Button>

          {/* Score */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold">
                {feedback.score}
                <span className="text-2xl text-muted-foreground">/100</span>
              </CardTitle>
              <CardDescription>Roleplay Performance Score</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={feedback.score} className="h-3" />
            </CardContent>
          </Card>

          {/* Overall Feedback */}
          {feedback.overallFeedback && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm">{feedback.overallFeedback}</p>
              </CardContent>
            </Card>
          )}

          {/* KPI Scores */}
          {feedback.kpiScores && feedback.kpiScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" /> KPI Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.kpiScores.map((kpi: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1">KPI {i + 1}:</span>
                        {kpi.kpi}
                      </p>
                      <Badge variant={kpi.score >= 20 ? "default" : kpi.score >= 15 ? "secondary" : "destructive"}>
                        {kpi.score}/25
                      </Badge>
                    </div>
                    <Progress value={(kpi.score / 25) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{kpi.feedback}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(feedback.strengths || []).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" /> Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(feedback.improvements || []).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          {feedback.tips && feedback.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips for Next Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.tips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Try Again */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleTryAgain(false)}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Same Scenario
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleTryAgain(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" /> New Scenario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
