"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3, Loader2, Trophy, TrendingUp, AlertCircle } from "lucide-react";

export default function JudgePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const runJudge = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
  });

  const score = runJudge.data?.score;
  const pastScores = project?.scores || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Judge Simulator</h1>
          <p className="text-muted-foreground text-sm">
            Get scored by an AI judge using the official DECA rubric
          </p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => runJudge.mutate()}
        disabled={runJudge.isPending}
      >
        {runJudge.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scoring your project...</>
        ) : (
          <><BarChart3 className="h-4 w-4 mr-2" /> Run Judge Simulation</>
        )}
      </Button>

      {/* Current Score */}
      {score && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold">
                {Math.round(score.totalScore)}
                <span className="text-2xl text-muted-foreground">
                  /{score.maxScore}
                </span>
              </CardTitle>
              <CardDescription>
                {score.totalScore / score.maxScore >= 0.9
                  ? "Excellent! Competition-ready!"
                  : score.totalScore / score.maxScore >= 0.7
                  ? "Good work! Room for improvement."
                  : "Keep working — you've got this!"}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Category Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {score.categories?.map((cat: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span>
                      {cat.score}/{cat.maxPoints}
                    </span>
                  </div>
                  <Progress
                    value={(cat.score / cat.maxPoints) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">{cat.feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>

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
                  {score.strengths?.map((s: string, i: number) => (
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
                  <AlertCircle className="h-4 w-4 text-yellow-500" /> Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {score.improvements?.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {score.overallNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{score.overallNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Past Scores */}
      {pastScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastScores.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm p-2 rounded border">
                  <span className="text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                  <Badge variant="secondary">
                    {Math.round(s.totalScore)}/{s.maxScore}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
