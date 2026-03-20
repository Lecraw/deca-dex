"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  Clock,
  Presentation,
  FileText,
  Plus,
  CheckCircle,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventDetail {
  id: string;
  code: string;
  name: string;
  cluster: string;
  category: string;
  eventType: string;
  maxSlides: number | null;
  maxPages: number | null;
  presentationMin: number | null;
  prepMin: number | null;
  hasExam: boolean;
  teamMin: number;
  teamMax: number;
  description: string;
  rubricJson: { name: string; maxPoints: number; description: string; indicators: string[] }[];
  guidelinesJson: string[] | { formatting: string[]; requirements: string[]; tips: string[] };
  sectionsJson: { title: string; description: string; pageNumber?: number; slideNumber?: number; key?: string; required?: boolean }[];
}

export default function EventDetailPage() {
  const params = useParams();
  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: ["event", params.eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events?id=${params.eventId}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) return <p>Event not found.</p>;

  const totalRubricPoints = event.rubricJson.reduce((s, r) => s + r.maxPoints, 0);
  const guidelines = Array.isArray(event.guidelinesJson)
    ? event.guidelinesJson
    : [
        ...(event.guidelinesJson.requirements || []),
        ...(event.guidelinesJson.formatting || []),
        ...(event.guidelinesJson.tips || []),
      ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/event-catalog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge variant="outline">{event.code}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{event.cluster.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-3">
        <Badge className="gap-1">
          {event.eventType === "PITCH_DECK" ? (
            <><Presentation className="h-3 w-3" /> Pitch Deck</>
          ) : event.eventType === "WRITTEN_REPORT" ? (
            <><FileText className="h-3 w-3" /> Written Report</>
          ) : (
            "Roleplay"
          )}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {event.teamMin === event.teamMax ? event.teamMin : `${event.teamMin}-${event.teamMax}`} members
        </Badge>
        {event.presentationMin && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> {event.presentationMin} min presentation
          </Badge>
        )}
        {event.prepMin && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> {event.prepMin} min prep
          </Badge>
        )}
        {event.maxSlides && (
          <Badge variant="secondary">Max {event.maxSlides} slides</Badge>
        )}
        {event.maxPages && (
          <Badge variant="secondary">Max {event.maxPages} pages</Badge>
        )}
        {event.hasExam && <Badge variant="destructive">Exam Required</Badge>}
      </div>

      <p className="text-muted-foreground">{event.description}</p>

      {/* Start Project Button */}
      {(event.eventType === "PITCH_DECK" || event.eventType === "WRITTEN_REPORT") && (
        <Button size="lg" asChild>
          <Link href={`/projects/new?eventId=${event.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            Start a Project for This Event
          </Link>
        </Button>
      )}

      <Separator />

      {/* Rubric */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5" />
            Judging Rubric ({totalRubricPoints} points)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {event.rubricJson.map((cat) => (
              <div key={cat.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{cat.name}</h4>
                  <Badge variant="secondary">{cat.maxPoints} pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.indicators.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Sections */}
      {event.sectionsJson.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Required Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.sectionsJson.map((section, i) => (
                <div
                  key={section.key || section.title || i}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{section.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  {(section.pageNumber || section.slideNumber) && (
                    <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                      {section.pageNumber ? `Page ${section.pageNumber}` : `Slide ${section.slideNumber}`}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      {guidelines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" /> Guidelines & Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {guidelines.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
