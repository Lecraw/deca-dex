"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  CircleDot,
  CircleSlash,
  Loader2,
  Trophy,
  Users,
  Play,
} from "lucide-react";
import { Avatar } from "@/components/live/Avatar";

const logoMaskStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
  WebkitMaskImage: "url(/logo-white.png)",
  maskImage: "url(/logo-white.png)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

type Participant = {
  id: string;
  email: string;
  displayName: string;
  completed: boolean;
  totalScore: number | null;
  createdAt: string;
  completedAt: string | null;
};

type SessionDetail = {
  id: string;
  code: string;
  eventCode: string;
  eventName: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  prepStartedAt: string | null;
  scenario: string;
  performanceIndicators: string[];
  participants: Participant[];
};

export function HostSessionView({ sessionId }: { sessionId: string }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);

  const { data, isLoading } = useQuery<SessionDetail>({
    queryKey: ["host-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/host/session/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Kick off scenario generation once when we see a session in "generating".
  // The server endpoint is idempotent (no-op if already generated).
  const triggeredGenerate = useRef(false);
  useEffect(() => {
    if (data?.status === "generating" && !triggeredGenerate.current) {
      triggeredGenerate.current = true;
      fetch(`/api/host/session/${sessionId}/generate`, { method: "POST" })
        .catch(() => {})
        .finally(() => {
          qc.invalidateQueries({ queryKey: ["host-session", sessionId] });
        });
    }
  }, [data?.status, sessionId, qc]);

  const closeSession = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/host/session/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to close");
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["host-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["host-sessions"] });
    },
  });

  const startPrep = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/host/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_prep" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start prep");
      }
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["host-session", sessionId] });
    },
  });

  const copyCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyJoinLink = async () => {
    if (!data) return;
    const url = `${window.location.origin}/play?code=${data.code}`;
    await navigator.clipboard.writeText(url);
    setCopiedJoinLink(true);
    setTimeout(() => setCopiedJoinLink(false), 1500);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const open = data.status === "open";
  const generating = data.status === "generating";
  const scenarioFailed = data.status === "scenario_failed";
  const ranked = [...data.participants]
    .filter((p) => p.completed)
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  const inProgress = data.participants.filter((p) => !p.completed);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/host"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="w-6 h-6" style={logoMaskStyle} />
            <span className="font-semibold text-sm tracking-tight">
              {data.eventName} <span className="text-muted-foreground font-normal">· {data.eventCode}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`/api/host/session/${sessionId}/export`} download>
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </a>
            </Button>
            {generating && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Generating scenario…
              </Badge>
            )}
            {open && !data.prepStartedAt && (
              <Button
                size="sm"
                onClick={() => startPrep.mutate()}
                disabled={startPrep.isPending || data.participants.length === 0}
              >
                {startPrep.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1.5" /> Start Prep for Everyone</>
                )}
              </Button>
            )}
            {data.prepStartedAt && (
              <Badge variant="outline" className="gap-1">
                <Play className="h-3 w-3" /> Prep started{" "}
                {new Date(data.prepStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            )}
            {open && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => closeSession.mutate()}
                disabled={closeSession.isPending}
              >
                {closeSession.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <><CircleSlash className="h-3.5 w-3.5 mr-1.5" /> Close</>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {startPrep.isError && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
            {startPrep.error instanceof Error ? startPrep.error.message : "Failed to start prep."}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Code block */}
        <Card className="border-primary/30 bg-gradient-to-br from-background via-background to-primary/5">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <Badge variant={open ? "default" : "secondary"} className="gap-1">
              {generating ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Preparing scenario…</>
              ) : scenarioFailed ? (
                <><CircleSlash className="h-3 w-3" /> Scenario failed — close and retry</>
              ) : open ? (
                <><CircleDot className="h-3 w-3" /> Session Open</>
              ) : (
                <><CircleSlash className="h-3 w-3" /> Session Closed</>
              )}
            </Badge>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Join code</p>
            <p className="text-7xl md:text-8xl font-bold font-mono tracking-[0.15em] tabular-nums">
              {data.code}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Button variant="outline" size="sm" onClick={copyJoinLink}>
                {copiedJoinLink ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                {copiedJoinLink ? "Copied" : "Copy join link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Players enter this code at{" "}
              <span className="font-mono text-foreground">/play</span> to join.
            </p>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Joined" value={data.participants.length} />
          <StatCard label="In progress" value={inProgress.length} />
          <StatCard label="Completed" value={ranked.length} />
          <StatCard
            label="Avg score"
            value={
              ranked.length > 0
                ? Math.round(
                    ranked.reduce((s, p) => s + (p.totalScore ?? 0), 0) / ranked.length
                  )
                : "—"
            }
          />
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranked.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Scores will appear here once participants finish.
              </p>
            ) : (
              <div className="space-y-1">
                {ranked.map((p, i) => (
                  <ParticipantRow key={p.id} rank={i + 1} participant={p} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In-progress + all participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> All Participants ({data.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No one has joined yet. Share the code.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                      <th className="py-2 pr-3">Display name</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Score</th>
                      <th className="py-2 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((p) => (
                      <tr key={p.id} className="border-b last:border-none">
                        <td className="py-2 pr-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar seed={p.id} displayName={p.displayName} size="sm" />
                            {p.displayName}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{p.email}</td>
                        <td className="py-2 pr-3">
                          {p.completed ? (
                            <Badge variant="default" className="text-[10px]">Finished</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Playing…</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {p.totalScore !== null ? (
                            <span className="font-semibold">{p.totalScore}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scenario preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Shared scenario (all participants receive this)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.scenario}</p>
            {data.performanceIndicators.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Performance Indicators</p>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  {data.performanceIndicators.map((pi, i) => (
                    <li key={i}>{pi}</li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </CardContent>
    </Card>
  );
}

function ParticipantRow({ rank, participant }: { rank: number; participant: Participant }) {
  const medal =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-none">
      <span className="w-8 text-center font-semibold tabular-nums">
        {medal ?? `#${rank}`}
      </span>
      <Avatar seed={participant.id} displayName={participant.displayName} size="sm" />
      <span className="flex-1 font-medium">{participant.displayName}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{participant.email}</span>
      <span className="font-mono font-semibold tabular-nums">
        {participant.totalScore ?? "—"}
      </span>
    </div>
  );
}
