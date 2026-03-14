"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare } from "lucide-react";

const severityColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-red-100 text-red-800",
};

export default function FeedbackPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const feedback = project?.feedback || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">AI Feedback</h1>
          <p className="text-muted-foreground text-sm">
            All AI-generated feedback for your project
          </p>
        </div>
      </div>

      {feedback.length > 0 ? (
        <div className="space-y-3">
          {feedback.map((fb: any) => (
            <Card key={fb.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${severityColors[fb.severity]}`}>
                        {fb.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {fb.feedbackType.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{fb.content}</p>
                    {fb.suggestion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Suggestion: {fb.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No feedback yet</h3>
            <p className="text-sm text-muted-foreground">
              Edit your slides or report and click &quot;AI Feedback&quot; to get suggestions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
