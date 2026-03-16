"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Lightbulb,
  Sparkles,
  Package,
  Loader2,
  Quote,
  Target,
  Clock,
  Shield,
  Mic2,
  LayoutList,
  RefreshCw,
  BarChart3,
  Image,
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  DELIVERY: Mic2,
  STRUCTURE: LayoutList,
  JUDGES: Target,
  CONFIDENCE: Shield,
  TIMING: Clock,
};

const categoryColors: Record<string, string> = {
  DELIVERY: "text-blue-500",
  STRUCTURE: "text-green-500",
  JUDGES: "text-red-500",
  CONFIDENCE: "text-purple-500",
  TIMING: "text-orange-500",
};

interface TipsData {
  generalTips: { tip: string; category: string }[];
  creativeHooks: { line: string; context: string }[];
  propIdeas: { prop: string; howToUse: string }[];
  graphicIdeas: { visual: string; slide: string; why: string }[];
}

export default function TipsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [tips, setTips] = useState<TipsData | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const generateTips = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        let errMsg = "Failed to generate tips";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          // Response wasn't JSON (e.g. HTML error page)
        }
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setTips(data);
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Presentation Tips</h1>
            <p className="text-muted-foreground text-sm">
              AI-powered tips, creative hooks, and prop ideas for your presentation
            </p>
          </div>
        </div>
        {tips && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateTips.mutate()}
            disabled={generateTips.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${generateTips.isPending ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        )}
      </div>

      {!tips && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => generateTips.mutate()}
          disabled={generateTips.isPending}
        >
          {generateTips.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating tips...</>
          ) : (
            <><Lightbulb className="h-4 w-4 mr-2" /> Generate Presentation Tips</>
          )}
        </Button>
      )}

      {generateTips.isError && (
        <p className="text-sm text-red-500 text-center">
          {(generateTips.error as Error).message}
        </p>
      )}

      {tips && (
        <div className="space-y-6">
          {/* General Tips */}
          {tips.generalTips && tips.generalTips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Presentation Tips
                </CardTitle>
                <CardDescription>
                  Practical advice to elevate your DECA presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.generalTips.map((item, i) => {
                  const Icon = categoryIcons[item.category] || Lightbulb;
                  const color = categoryColors[item.category] || "text-amber-500";
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.tip}</p>
                        <Badge variant="outline" className="mt-1.5 text-[10px]">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Creative Hooks */}
          {tips.creativeHooks && tips.creativeHooks.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Creative Hooks &amp; Lines
                </CardTitle>
                <CardDescription>
                  Memorable phrases and wordplay for your presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.creativeHooks.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50">
                    <div className="flex items-start gap-2">
                      <Quote className="h-4 w-4 text-purple-400 shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium italic">&ldquo;{item.line}&rdquo;</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.context}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Prop Ideas */}
          {tips.propIdeas && tips.propIdeas.length > 0 && (
            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" />
                  Prop Ideas
                </CardTitle>
                <CardDescription>
                  Physical props to make your presentation stand out
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.propIdeas.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                    <Package className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{item.prop}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.howToUse}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Graphic & Visual Ideas */}
          {tips.graphicIdeas && tips.graphicIdeas.length > 0 && (
            <Card className="border-sky-200 dark:border-sky-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-sky-500" />
                  Graphic &amp; Visual Ideas
                </CardTitle>
                <CardDescription>
                  Charts, diagrams, and visuals to strengthen your slides
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.graphicIdeas.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50">
                    <div className="flex items-start gap-3">
                      <Image className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.visual}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px] border-sky-200 dark:border-sky-800">
                            📍 {item.slide}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.why}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
