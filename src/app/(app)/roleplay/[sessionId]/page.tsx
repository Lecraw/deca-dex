"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  RoleplaySessionUI,
  type RoleplaySessionData,
  type RoleplayScore,
  type QuizResult,
} from "@/components/roleplay/RoleplaySessionUI";

export default function RoleplaySessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const { data, isLoading } = useQuery<RoleplaySessionData>({
    queryKey: ["roleplay-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/roleplay?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
  });

  const onEndSession = async (fullTranscript: string): Promise<RoleplayScore> => {
    const res = await fetch("/api/ai/roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end_session",
        sessionId,
        fullTranscript,
      }),
    });
    const text = await res.text();
    const jsonStr = text.replace(/^\s+/, "").trim();
    const jsonStart = jsonStr.indexOf("{");
    if (jsonStart === -1) throw new Error("Failed to get score. Please try again.");
    const parsed = JSON.parse(jsonStr.substring(jsonStart));
    if (parsed.error) throw new Error(parsed.error);
    return parsed as RoleplayScore;
  };

  const onSubmitQuiz = async (answers: number[]): Promise<QuizResult> => {
    const res = await fetch("/api/ai/roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_quiz",
        sessionId,
        answers,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Failed to submit quiz.");
    }
    return data as QuizResult;
  };

  return (
    <RoleplaySessionUI
      sessionData={data}
      isLoading={isLoading}
      onEndSession={onEndSession}
      onSubmitQuiz={onSubmitQuiz}
      backHref="/roleplay"
      newHref="/roleplay"
    />
  );
}
