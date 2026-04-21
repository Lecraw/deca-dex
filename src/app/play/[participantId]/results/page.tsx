"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Trophy,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Home,
} from "lucide-react";

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

type Score = {
  totalScore: number;
  overallFeedback?: string;
  piScores?: Array<{
    indicator: string;
    score: number;
    maxPoints: number;
    feedback: string;
    level?: string;
  }>;
  twentyFirstCenturyScores?: Array<{
    skill: string;
    score: number;
    maxPoints: number;
  }>;
  strengths?: string[];
  improvements?: string[];
};

type SessionResp = {
  id: string;
  eventName: string;
  eventCode: string;
  completed: boolean;
  score: Score | null;
};

type LeaderboardEntry = {
  rank: number;
  id: string;
  displayName: string;
  totalScore: number;
  isMe: boolean;
};

type LeaderboardResp = {
  meId: string;
  participants: LeaderboardEntry[];
};

export default function ResultsPage() {
  const params = useParams();
  const participantId = params.participantId as string;

  const { data: session, isLoading: sessionLoading } = useQuery<SessionResp>({
    queryKey: ["live-participant", participantId, "for-results"],
    queryFn: async () => {
      const res = await fetch(`/api/live-session/roleplay?participantId=${participantId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: board } = useQuery<LeaderboardResp>({
    queryKey: ["live-leaderboard", participantId],
    queryFn: async () => {
      const res = await fetch("/api/live-session/leaderboard");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 5000,
    enabled: !!session,
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your results.
          </p>
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!session.score) {
    // Two states collapse here:
    //  - Participant never finished (completed:false) → send them back in.
    //  - Grading is in-flight (completed:true + score:null) → show a
    //    "scoring" loader so they don't bounce back to the play page.
    if (session.completed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-sm text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              The judge is scoring your roleplay…
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t finished this roleplay yet.
          </p>
          <Button asChild>
            <Link href={`/play/${participantId}`}>Continue</Link>
          </Button>
        </div>
      </div>
    );
  }

  const score = session.score;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6" style={logoMaskStyle} />
            <span className="font-semibold tracking-tight text-sm">
              DUZZ <span className="text-muted-foreground font-normal">· {session.eventCode}</span>
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/"><Home className="h-4 w-4 mr-1.5" /> Home</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Total score */}
        <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-6xl font-bold tabular-nums">
              {score.totalScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </CardTitle>
            <CardDescription>Your roleplay score</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={score.totalScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {board && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Session Leaderboard
              </CardTitle>
              <CardDescription>Updates every few seconds as others finish.</CardDescription>
            </CardHeader>
            <CardContent>
              {board.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No finished scores yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {board.participants.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 py-2 px-2 rounded ${
                        p.isMe ? "bg-primary/10 border border-primary/30" : ""
                      }`}
                    >
                      <span className="w-8 text-center font-semibold tabular-nums text-sm">
                        {p.rank === 1
                          ? "🥇"
                          : p.rank === 2
                          ? "🥈"
                          : p.rank === 3
                          ? "🥉"
                          : `#${p.rank}`}
                      </span>
                      <span className="flex-1 font-medium text-sm">
                        {p.displayName}
                        {p.isMe && (
                          <Badge variant="outline" className="ml-2 text-[10px]">you</Badge>
                        )}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-sm">
                        {p.totalScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overall feedback */}
        {score.overallFeedback && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">{score.overallFeedback}</p>
            </CardContent>
          </Card>
        )}

        {/* PI scores */}
        {score.piScores && score.piScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-500" /> Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {score.piScores.map((pi, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-1">PI {i + 1}:</span>
                      {pi.indicator}
                    </p>
                    <Badge
                      variant={
                        pi.score >= pi.maxPoints * 0.7
                          ? "default"
                          : pi.score >= pi.maxPoints * 0.5
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {pi.score}/{pi.maxPoints}
                    </Badge>
                  </div>
                  <Progress value={(pi.score / pi.maxPoints) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">{pi.feedback}</p>
                  {pi.level && (
                    <p className="text-[10px] text-muted-foreground italic">Level: {pi.level}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 21st C skills */}
        {score.twentyFirstCenturyScores && score.twentyFirstCenturyScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> 21st Century Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {score.twentyFirstCenturyScores.map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{skill.skill}</p>
                    <Badge variant="outline">
                      {skill.score}/{skill.maxPoints}
                    </Badge>
                  </div>
                  <Progress value={(skill.score / skill.maxPoints) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strengths / improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(score.strengths || []).map((s, i) => (
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
                {(score.improvements || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
