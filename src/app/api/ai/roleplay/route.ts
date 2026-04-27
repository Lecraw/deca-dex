import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import {
  generateScenario,
  gradeRoleplay,
  generateQuiz,
  gradeQuiz,
  sanitizeQuiz,
  type QuizQuestion,
} from "@/lib/ai/live-roleplay";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400 });
  }

  const roleplaySession = await prisma.roleplaySession.findUnique({
    where: { id: sessionId },
  });

  if (!roleplaySession || roleplaySession.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
  }

  const scenarioData = JSON.parse(roleplaySession.scenarioJson);
  const messages = JSON.parse(roleplaySession.messagesJson);
  const score = roleplaySession.scoreJson ? JSON.parse(roleplaySession.scoreJson) : null;

  const quizQuestions = score?.quizQuestionsCache
    ? sanitizeQuiz(score.quizQuestionsCache as QuizQuestion[])
    : null;
  const quizSubmitted = !!score?.quizResult;

  return new Response(
    JSON.stringify({
      id: roleplaySession.id,
      eventCode: roleplaySession.eventCode,
      eventName: scenarioData.eventName || roleplaySession.eventCode,
      eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
      scenario: scenarioData.scenario,
      performanceIndicators: scenarioData.performanceIndicators || [],
      twentyFirstCenturySkills: scenarioData.twentyFirstCenturySkills || [],
      judgeFollowUpQuestions: (scenarioData.judgeFollowUpQuestions || []).slice(0, 2),
      messages,
      completed: roleplaySession.completed,
      score,
      quizQuestions,
      quizSubmitted,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // =============================================
  // START SESSION — generate scenario + PIs
  // =============================================
  if (action === "start_session") {
    const { eventCode } = body;
    if (!eventCode) {
      return new Response(JSON.stringify({ error: "eventCode required" }), { status: 400 });
    }

    const event = await prisma.decaEvent.findUnique({ where: { code: eventCode } });
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    const userId = session.user.id;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const scenarioData = await generateScenario(event, { controller, encoder });

          if (!scenarioData) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to generate scenario. Please try again." })));
            controller.close();
            return;
          }

          const roleplaySession = await prisma.roleplaySession.create({
            data: {
              userId,
              eventCode,
              scenarioJson: JSON.stringify(scenarioData),
              messagesJson: JSON.stringify([]),
              completed: false,
            },
          });

          controller.enqueue(encoder.encode(JSON.stringify({ sessionId: roleplaySession.id })));
          controller.close();
        } catch (err) {
          const message = (err as Error).message || "unknown error";
          console.error("Roleplay start error:", message, err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: `Failed to create session: ${message}` })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  }

  // =============================================
  // END SESSION — grade the full transcript
  // =============================================
  if (action === "end_session") {
    const { sessionId, fullTranscript } = body;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400 });
    }

    const roleplaySession = await prisma.roleplaySession.findUnique({
      where: { id: sessionId },
    });

    if (!roleplaySession || roleplaySession.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    const scenarioData = JSON.parse(roleplaySession.scenarioJson);
    const userId = session.user.id;
    const event = await prisma.decaEvent.findUnique({ where: { code: roleplaySession.eventCode } });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await gradeRoleplay(
            {
              eventCode: roleplaySession.eventCode,
              eventName: scenarioData.eventName || roleplaySession.eventCode,
              eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
              scenario: scenarioData.scenario,
              performanceIndicators: scenarioData.performanceIndicators || [],
              fullTranscript: fullTranscript ?? "",
            },
            { controller, encoder }
          );

          if (!result) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to parse evaluation. Please try again." })));
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

          const stored = quiz
            ? { ...result, quizQuestionsCache: quiz }
            : result;

          await prisma.roleplaySession.update({
            where: { id: sessionId },
            data: {
              messagesJson: JSON.stringify(
                fullTranscript ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }] : []
              ),
              scoreJson: JSON.stringify(stored),
              completed: true,
            },
          });

          await awardXp(userId, "COMPLETE_ROLEPLAY", { eventCode: roleplaySession.eventCode });
          await checkAndAwardBadges(userId);

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ ...result, quizQuestions: quiz ? sanitizeQuiz(quiz) : [] })
            )
          );
          controller.close();
        } catch (err) {
          const message = (err as Error).message || "unknown error";
          console.error("Roleplay score error:", message, err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: `Scoring failed: ${message}` })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  }

  // =============================================
  // SUBMIT QUIZ — grade the cached quiz
  // =============================================
  if (action === "submit_quiz") {
    const { sessionId, answers } = body;
    if (!sessionId || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "sessionId and answers[] required" }), { status: 400 });
    }

    const roleplaySession = await prisma.roleplaySession.findUnique({ where: { id: sessionId } });
    if (!roleplaySession || roleplaySession.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }
    if (!roleplaySession.scoreJson) {
      return new Response(JSON.stringify({ error: "Finish the roleplay first." }), { status: 400 });
    }

    const stored = JSON.parse(roleplaySession.scoreJson);
    const cached = stored?.quizQuestionsCache as QuizQuestion[] | undefined;
    if (!cached || !Array.isArray(cached) || cached.length === 0) {
      return new Response(JSON.stringify({ error: "No quiz available for this session." }), { status: 400 });
    }

    const { quizScore, correctAnswers } = gradeQuiz(cached, answers as number[]);
    const roleplayScore = typeof stored.totalScore === "number" ? stored.totalScore : 0;
    const totalScore = Math.round(((roleplayScore + quizScore) / 2) * 10) / 10;

    const quizResult = {
      roleplayScore,
      quizScore,
      totalScore,
      correctAnswers,
      userAnswers: answers,
    };

    await prisma.roleplaySession.update({
      where: { id: sessionId },
      data: { scoreJson: JSON.stringify({ ...stored, quizResult }) },
    });

    return new Response(JSON.stringify(quizResult), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
