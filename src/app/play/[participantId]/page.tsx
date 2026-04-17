"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  RoleplaySessionUI,
  type RoleplaySessionData,
  type RoleplayScore,
} from "@/components/roleplay/RoleplaySessionUI";

type LiveSessionResponse = RoleplaySessionData & { sessionStatus: string };

export default function PlaySessionPage() {
  const params = useParams();
  const router = useRouter();
  const participantId = params.participantId as string;

  const { data, isLoading, error } = useQuery<LiveSessionResponse>({
    queryKey: ["live-participant", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/live-session/roleplay?participantId=${participantId}`);
      if (res.status === 401 || res.status === 403) {
        throw new Error("unauth");
      }
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    retry: false,
  });

  const onEndSession = async (fullTranscript: string): Promise<RoleplayScore> => {
    const res = await fetch("/api/live-session/roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end_session",
        participantId,
        fullTranscript,
      }),
    });
    const text = await res.text();
    const jsonStr = text.replace(/^\s+/, "").trim();
    const jsonStart = jsonStr.indexOf("{");
    if (jsonStart === -1) throw new Error("Failed to get score. Please try again.");
    const parsed = JSON.parse(jsonStr.substring(jsonStart));
    if (parsed.error) throw new Error(parsed.error);
    router.prefetch(`/play/${participantId}/results`);
    return parsed as RoleplayScore;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this session. Your session may have expired — please rejoin with the game code.
          </p>
          <Button asChild>
            <Link href="/play">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Join
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <RoleplaySessionUI
        sessionData={data}
        isLoading={isLoading}
        onEndSession={onEndSession}
        backHref="/"
        newHref={`/play/${participantId}/results`}
        newLabel="View Leaderboard"
        headerSubtitle="Live Session"
      />
    </div>
  );
}
