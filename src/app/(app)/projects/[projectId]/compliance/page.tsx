"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Loader2, ShieldOff } from "lucide-react";

export default function CompliancePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [overriddenChecks, setOverriddenChecks] = useState<Set<string>>(new Set());

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  // Load saved overrides from project data
  useEffect(() => {
    if (project?.complianceJson) {
      const data = typeof project.complianceJson === "string"
        ? JSON.parse(project.complianceJson)
        : project.complianceJson;
      if (data.overrides && Array.isArray(data.overrides)) {
        setOverriddenChecks(new Set(data.overrides));
      }
    }
  }, [project?.complianceJson]);

  const runCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          overrides: Array.from(overriddenChecks),
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text.trim());
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const saveOverrides = async (newOverrides: Set<string>) => {
    // Save overrides to the database
    await fetch(`/api/projects/${projectId}/overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: Array.from(newOverrides) }),
    });
  };

  const compliance = runCheck.data || (project?.complianceJson
    ? (typeof project.complianceJson === "string" ? JSON.parse(project.complianceJson) : project.complianceJson)
    : null);

  const handleOverride = (checkName: string) => {
    setOverriddenChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkName)) {
        next.delete(checkName);
      } else {
        next.add(checkName);
      }
      saveOverrides(next);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Compliance Checker</h1>
          <p className="text-muted-foreground text-sm">
            Verify your project meets all DECA requirements
          </p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => runCheck.mutate()}
        disabled={runCheck.isPending}
      >
        {runCheck.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking compliance...</>
        ) : (
          <><CheckCircle className="h-4 w-4 mr-2" /> Run Compliance Check</>
        )}
      </Button>

      {runCheck.isError && (
        <p className="text-sm text-red-500 text-center">
          {(runCheck.error as Error).message}
        </p>
      )}

      {compliance && (
        <>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold">
                {compliance.score}
                <span className="text-2xl text-muted-foreground">/100</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">DECA Readiness Score</p>
            </CardHeader>
            <CardContent>
              <Progress value={compliance.score} className="h-3" />
            </CardContent>
          </Card>

          {overriddenChecks.size > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {overriddenChecks.size} check{overriddenChecks.size > 1 ? "s" : ""} overridden — these will stay overridden on the next check
            </p>
          )}

          <div className="space-y-2">
            {[...(compliance.checks || [])].sort((a: any, b: any) => Number(a.passed) - Number(b.passed)).map((check: any, i: number) => {
              const isOverridden = overriddenChecks.has(check.name);
              return (
                <Card key={i} className={isOverridden ? "opacity-50" : check.passed ? "" : "border-yellow-200"}>
                  <CardContent className="p-4 flex items-start gap-3">
                    {isOverridden ? (
                      <ShieldOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    ) : check.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : check.severity === "error" ? (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isOverridden ? "line-through text-muted-foreground" : ""}`}>
                        {check.name}
                      </p>
                      <p className={`text-sm ${isOverridden ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                        {check.message}
                      </p>
                    </div>
                    {!check.passed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs"
                        onClick={() => handleOverride(check.name)}
                      >
                        {isOverridden ? "Undo" : "Override"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
