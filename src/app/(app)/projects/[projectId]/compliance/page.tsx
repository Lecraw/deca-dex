"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

export default function CompliancePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const runCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const compliance = runCheck.data || (project?.complianceJson as any);

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

          <div className="space-y-2">
            {compliance.checks?.map((check: any, i: number) => (
              <Card key={i} className={check.passed ? "" : "border-yellow-200"}>
                <CardContent className="p-4 flex items-start gap-3">
                  {check.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : check.severity === "error" ? (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{check.name}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
