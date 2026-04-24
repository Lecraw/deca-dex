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
      select: { code: true, name: true, cluster: true, description: true },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const grade = await gradeRoleplay(
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

          if (!grade) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ error: "Failed to parse evaluation. Please try again." })
              )
            );
            controller.close();
            return;
          }

          // Reuse a cached quiz if the participant already has one (refresh after
          // first end_session call). Otherwise, generate a fresh batch.
          let quiz: QuizQuestion[] | null = null;
          if (participant.quizQuestionsJson) {
            try {
              quiz = JSON.parse(participant.quizQuestionsJson) as QuizQuestion[];
            } catch {
              quiz = null;
            }
          }
          if (!quiz && event) {
            quiz = await generateQuiz(event);
          }
          if (!quiz) {
            // Fall back: if quiz generation fails, mark quiz complete with a 0-question
            // quiz so the participant isn't stranded. Treat the roleplay as the full
            // score (no quiz penalty).
            await prisma.liveParticipant.update({
              where: { id: participant.id },
              data: {
                messagesJson: JSON.stringify(
                  fullTranscript
                    ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }]
                    : []
                ),
                scoreJson: JSON.stringify(grade),
                roleplayScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
                quizQuestionsJson: JSON.stringify([]),
                quizAnswersJson: JSON.stringify([]),
                quizScore: 0,
                totalScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
                completed: true,
                completedAt: new Date(),
              },
            });
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ ...grade, quizQuestions: [] })
              )
            );
            controller.close();
            return;
          }

          await prisma.liveParticipant.update({
            where: { id: participant.id },
            data: {
              messagesJson: JSON.stringify(
                fullTranscript
                  ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }]
                  : []
              ),
              scoreJson: JSON.stringify(grade),
              roleplayScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
              quizQuestionsJson: JSON.stringify(quiz),
              // Intentionally NOT setting: totalScore, completed, completedAt.
              // Those are set when the quiz is submitted via submit_quiz.
            },
          });

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ ...grade, quizQuestions: sanitizeQuiz(quiz) })
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

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
