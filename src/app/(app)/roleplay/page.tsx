"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Loader2,
  Trophy,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function RoleplayPage() {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [step, setStep] = useState<"select" | "loading">("select");

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      return res.json();
    },
  });

  const roleplayEvents = events.filter((e: any) => e.eventType === "ROLEPLAY");

  // Group events by category
  const principlesEvents = roleplayEvents.filter((e: any) => e.category === "PRINCIPLES_EVENTS");
  const individualEvents = roleplayEvents.filter((e: any) => e.category === "INDIVIDUAL_SERIES");
  const teamEvents = roleplayEvents.filter((e: any) => e.category === "TEAM_DECISION_MAKING");
  const otherEvents = roleplayEvents.filter(
    (e: any) =>
      e.category !== "PRINCIPLES_EVENTS" &&
      e.category !== "INDIVIDUAL_SERIES" &&
      e.category !== "TEAM_DECISION_MAKING"
  );

  const startSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_session",
          eventCode: selectedEvent,
        }),
      });
      const text = await res.text();
      // Strip keepalive spaces, find the JSON object
      const jsonStr = text.replace(/^\s+/, "").trim();
      const jsonStart = jsonStr.indexOf("{");
      if (jsonStart === -1) throw new Error("Failed to start roleplay. Please try again.");
      const data = JSON.parse(jsonStr.substring(jsonStart));
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        router.push(`/roleplay/${data.sessionId}`);
      }
    },
  });

  const handleStart = () => {
    setStep("loading");
    startSession.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Roleplay Practice</h1>
        <p className="text-muted-foreground">
          Practice DECA roleplays with speech — talk through your response and get AI judge feedback
        </p>
      </div>

      {step === "select" && (
        <div className="space-y-6">
          {/* How it works */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-500" />
                How It Works
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Select your event and generate a scenario with performance indicators</li>
                <li>Review the scenario during your 10-minute prep time</li>
                <li>Press the mic button and speak your presentation — speech is transcribed live</li>
                <li>The AI judge asks follow-up questions (you respond by speaking)</li>
                <li>Get scored on each PI and 21st Century Skills, just like a real DECA judge</li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="font-semibold">Select an Event</h2>

          {/* Principles Events */}
          {principlesEvents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Principles Events (4 PIs · 10 min prep · 10 min present)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {principlesEvents.map((event: any) => (
                  <EventCard key={event.code} event={event} selected={selectedEvent === event.code} onSelect={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Individual Series */}
          {individualEvents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Individual Series (5 PIs · 10 min prep · 10 min present)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {individualEvents.map((event: any) => (
                  <EventCard key={event.code} event={event} selected={selectedEvent === event.code} onSelect={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Team Decision Making */}
          {teamEvents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Decision Making (7 PIs · 30 min)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamEvents.map((event: any) => (
                  <EventCard key={event.code} event={event} selected={selectedEvent === event.code} onSelect={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Other events */}
          {otherEvents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Other Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherEvents.map((event: any) => (
                  <EventCard key={event.code} event={event} selected={selectedEvent === event.code} onSelect={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleStart}
            disabled={!selectedEvent || startSession.isPending}
          >
            {startSession.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up roleplay...</>
            ) : (
              <><MessageSquare className="h-4 w-4 mr-2" /> Start Roleplay Session</>
            )}
          </Button>
        </div>
      )}

      {step === "loading" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Generating your scenario and performance indicators...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EventCard({ event, selected, onSelect }: { event: any; selected: boolean; onSelect: (code: string) => void }) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
      }`}
      onClick={() => onSelect(event.code)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className="text-xs">{event.code}</Badge>
          <Badge variant="secondary" className="text-xs">
            {event.teamMin === 1 ? "Individual" : "Team"}
          </Badge>
        </div>
        <p className="font-medium text-sm">{event.name}</p>
      </CardContent>
    </Card>
  );
}
