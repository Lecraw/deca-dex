import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readParticipant } from "@/lib/live-session";
import {
  gradeRoleplay,
  generateQuiz,
  gradeQuiz,
  sanitizeQuiz,
  type QuizQuestion,
} from "@/lib/ai/live-roleplay";

export async function GET(req: NextRequest) {
  const auth = await readParticipant();
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  if (!participantId || participantId !== auth.participantId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const participant = await prisma.liveParticipant.findUnique({
    where: { id: participantId },
    include: { session: true },
  });

  if (!participant) {
    return new Response(JSON.stringify({ error: "Participant not found" }), { status: 404 });
  }

  const scenarioData = JSON.parse(participant.session.scenarioJson);
  const messages = participant.messagesJson ? JSON.parse(participant.messagesJson) : [];
  const score = participant.scoreJson ? JSON.parse(participant.scoreJson) : null;

  const quizQuestions = score?.quizQuestionsCache
    ? sanitizeQuiz(score.quizQuestionsCache as QuizQuestion[])
    : null;
  const quizSubmitted = !!score?.quizResult;

  return new Response(
    JSON.stringify({
      id: participant.id,
      eventCode: participant.session.eventCode,
      eventName: scenarioData.eventName || participant.session.eventCode,
      eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
      scenario: scenarioData.scenario,
      performanceIndicators: scenarioData.performanceIndicators || [],
      twentyFirstCenturySkills: scenarioData.twentyFirstCenturySkills || [],
      judgeFollowUpQuestions: (scenarioData.judgeFollowUpQuestions || []).slice(0, 2),
      messages,
      completed: participant.completed,
      score,
      sessionStatus: participant.session.status,
      roleplayStartedAt: scenarioData.roleplayStartedAt ?? null,
      quizQuestions,
      quizSubmitted,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(req: NextRequest) {
  const auth = await readParticipant();
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { action?: string; fullTranscript?: string; participantId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const { action, fullTranscript, participantId } = body;
  if (!participantId || participantId !== auth.participantId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const participant = await prisma.liveParticipant.findUnique({
    where: { id: participantId },
    include: { session: true },
  });

  if (!participant) {
    return new Response(JSON.stringify({ error: "Participant not found" }), { status: 404 });
  }

  if (action === "end_session") {
    if (participant.completed) {
      return new Response(JSON.stringify({ error: "Already submitted." }), { status: 409 });
    }
    if (participant.session.status !== "open") {
      return new Response(
        JSON.stringify({ error: "This session has been closed by the host." }),
        { status: 409 }
      );
    }

    const scenarioData = JSON.parse(participant.session.scenarioJson);
    const event = await prisma.decaEvent.findUnique({
      where: { code: participant.session.eventCode },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await gradeRoleplay(
            {
              eventCode: participant.session.eventCode,
              eventName: scenarioData.eventName || participant.session.eventCode,
              eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
              scenario: scenarioData.scenario,
              performanceIndicators: scenarioData.performanceIndicators || [],
              fullTranscript: fullTranscript ?? "",
            },
            { controller, encoder }
          );

          if (!result) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ error: "Failed to parse evaluation. Please try again." })
              )
            );
            controller.close();
            return;
          }

          let quiz: QuizQuestion[] | null = null;
          if (event) {
            try {
              quiz = await generateQuiz(event);
            } catch (err) {
              console.error("Quiz generation failed:", err);
              quiz = null;
            }
          }

          const stored = quiz ? { ...result, quizQuestionsCache: quiz } : result;

          await prisma.liveParticipant.update({
            where: { id: participant.id },
            data: {
              messagesJson: JSON.stringify(
                fullTranscript
                  ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }]
                  : []
              ),
              scoreJson: JSON.stringify(stored),
              totalScore: typeof result.totalScore === "number" ? result.totalScore : 0,
              completed: true,
              completedAt: new Date(),
            },
          });

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                ...result,
                quizQuestions: quiz ? sanitizeQuiz(quiz) : [],
              })
            )
          );
          controller.close();
        } catch (err) {
          const message = (err as Error).message || "unknown error";
          console.error("Live roleplay score error:", message, err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: `Scoring failed: ${message}` })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  }

  if (action === "submit_quiz") {
    const answers = (body as { answers?: number[] }).answers;
    if (!Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: "answers[] required" }),
        { status: 400 }
      );
    }
    if (!participant.scoreJson) {
      return new Response(
        JSON.stringify({ error: "Finish the roleplay first." }),
        { status: 400 }
      );
    }

    const stored = JSON.parse(participant.scoreJson);
    const cached = stored?.quizQuestionsCache as QuizQuestion[] | undefined;
    if (!cached || !Array.isArray(cached) || cached.length === 0) {
      return new Response(
        JSON.stringify({ error: "No quiz available." }),
        { status: 400 }
      );
    }

    const { quizScore, correctAnswers } = gradeQuiz(cached, answers);
    const roleplayScore = typeof stored.totalScore === "number" ? stored.totalScore : 0;
    const totalScore = Math.round(((roleplayScore + quizScore) / 2) * 10) / 10;

    const quizResult = {
      roleplayScore,
      quizScore,
      totalScore,
      correctAnswers,
      userAnswers: answers,
    };

    await prisma.liveParticipant.update({
      where: { id: participant.id },
      data: {
        scoreJson: JSON.stringify({ ...stored, quizResult }),
        totalScore,
      },
    });

    return new Response(JSON.stringify(quizResult), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
