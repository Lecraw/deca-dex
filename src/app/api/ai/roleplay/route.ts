import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import Anthropic from "@anthropic-ai/sdk";

// Real DECA scoring structures by event category
const SCORING_CONFIG = {
  PRINCIPLES_EVENTS: {
    piCount: 4,
    piMaxPoints: 20,
    overallImpressionMax: 20,
    twentyFirstCenturySkills: [
      "Reason effectively and use systems thinking",
      "Make judgments and decisions, and solve problems",
      "Communicate clearly",
      "Show evidence of creativity",
    ],
  },
  INDIVIDUAL_SERIES: {
    piCount: 5,
    piMaxPoints: 14,
    twentyFirstCenturySkills: [
      "Reason effectively and use systems thinking",
      "Make judgments and decisions, and solve problems",
      "Communicate clearly",
      "Show evidence of creativity",
    ],
    twentyFirstCenturyMaxPoints: 6,
    overallImpressionMax: 6,
  },
  TEAM_DECISION_MAKING: {
    piCount: 7,
    piMaxPoints: 10,
    twentyFirstCenturySkills: [
      "Clarity of expression",
      "Organization of ideas",
      "Evidence of mature judgment",
      "Effective participation of both team members",
    ],
    twentyFirstCenturyMaxPoints: 6,
    overallImpressionMax: 6,
  },
};

function getScoringConfig(category: string) {
  if (category in SCORING_CONFIG) {
    return SCORING_CONFIG[category as keyof typeof SCORING_CONFIG];
  }
  return SCORING_CONFIG.PRINCIPLES_EVENTS;
}

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

  return new Response(
    JSON.stringify({
      id: roleplaySession.id,
      eventCode: roleplaySession.eventCode,
      eventName: scenarioData.eventName || roleplaySession.eventCode,
      eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
      scenario: scenarioData.scenario,
      performanceIndicators: scenarioData.performanceIndicators || [],
      twentyFirstCenturySkills: scenarioData.twentyFirstCenturySkills || [],
      judgeFollowUpQuestions: scenarioData.judgeFollowUpQuestions || [],
      messages,
      completed: roleplaySession.completed,
      score,
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

    const config = getScoringConfig(event.category);
    const userId = session.user.id;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          let fullText = "";

          const messageStream = client.messages.stream({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            system: `You are a DECA competition scenario generator for the ${event.name} (${eventCode}) event.

This is a ${event.category.replace(/_/g, " ")} event in the ${event.cluster.replace(/_/g, " ")} career cluster.

Generate a realistic DECA roleplay scenario. Return ONLY a JSON object (no markdown, no code blocks) with this structure:

{"scenario":"Full scenario text in 2nd person...","performanceIndicators":["PI 1","PI 2"${config.piCount > 2 ? ',...' : ''}],"judgeFollowUpQuestions":["Q1?","Q2?","Q3?"]}

Requirements:
- Scenario: 2-3 paragraphs, 2nd person ("You are to assume the role of..."), realistic business context, end with roleplay setup
- Exactly ${config.piCount} performance indicators as action statements from the ${event.cluster.replace(/_/g, " ")} cluster
- Exactly 3 follow-up questions`,
            messages: [
              {
                role: "user",
                content: `Generate a roleplay scenario with ${config.piCount} performance indicators for ${event.name} (${eventCode}).`,
              },
            ],
          });

          messageStream.on("text", (text) => {
            fullText += text;
            controller.enqueue(encoder.encode(" "));
          });

          await messageStream.finalMessage();

          let scenarioData;
          try {
            scenarioData = JSON.parse(fullText);
          } catch {
            try {
              const jsonMatch = fullText.match(/\{[\s\S]*\}/);
              scenarioData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch {
              scenarioData = null;
            }
          }

          if (!scenarioData?.scenario || !scenarioData?.performanceIndicators) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to generate scenario. Please try again." })));
            controller.close();
            return;
          }

          const twentyFirstCenturySkills = config.twentyFirstCenturySkills;

          const roleplaySession = await prisma.roleplaySession.create({
            data: {
              userId,
              eventCode,
              scenarioJson: JSON.stringify({
                scenario: scenarioData.scenario,
                performanceIndicators: scenarioData.performanceIndicators,
                judgeFollowUpQuestions: scenarioData.judgeFollowUpQuestions || [],
                twentyFirstCenturySkills,
                eventName: event.name,
                eventCategory: event.category,
              }),
              messagesJson: JSON.stringify([]),
              completed: false,
            },
          });

          controller.enqueue(encoder.encode(JSON.stringify({ sessionId: roleplaySession.id })));
          controller.close();
        } catch (err: any) {
          console.error("Roleplay start error:", err.message);
          controller.enqueue(encoder.encode(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." })));
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
    const eventCategory = scenarioData.eventCategory || "PRINCIPLES_EVENTS";
    const config = getScoringConfig(eventCategory);
    const pis = scenarioData.performanceIndicators || [];

    let scoringInstructions = "";

    if (eventCategory === "PRINCIPLES_EVENTS") {
      scoringInstructions = `
Score each PI on 0-20 (Exceeds 16-20, Meets 11-15, Below 6-10, Little/No 0-5).
Score "Overall Impression" on 0-20. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-20>,"maxPoints":20,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Overall Impression & Responses to Questions","score":<0-20>,"maxPoints":20}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
    } else if (eventCategory === "INDIVIDUAL_SERIES") {
      scoringInstructions = `
Score each PI on 0-14 (Exceeds 12-14, Meets 9-11, Below 5-8, Little/No 0-4).
Score 21st Century Skills on 0-6 each. Overall Impression on 0-6. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-14>,"maxPoints":14,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Reason effectively","score":<0-6>,"maxPoints":6},{"skill":"Make judgments","score":<0-6>,"maxPoints":6},{"skill":"Communicate clearly","score":<0-6>,"maxPoints":6},{"skill":"Show creativity","score":<0-6>,"maxPoints":6},{"skill":"Overall Impression","score":<0-6>,"maxPoints":6}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
    } else {
      scoringInstructions = `
Score each PI on 0-10 (Exceeds 9-10, Meets 7-8, Below 4-6, Little/No 0-3).
Score supplemental categories on 0-6 each. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-10>,"maxPoints":10,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Clarity of expression","score":<0-6>,"maxPoints":6},{"skill":"Organization of ideas","score":<0-6>,"maxPoints":6},{"skill":"Evidence of mature judgment","score":<0-6>,"maxPoints":6},{"skill":"Effective participation","score":<0-6>,"maxPoints":6},{"skill":"Overall Impression","score":<0-6>,"maxPoints":6}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
    }

    const piList = pis.map((p: string, i: number) => `PI ${i + 1}: ${p}`).join("; ");
    const userId = session.user.id;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          let fullText = "";

          const messageStream = client.messages.stream({
            model: "claude-3-haiku-20240307",
            max_tokens: 2500,
            system: `You are a DECA judge evaluating a student's roleplay for ${scenarioData.eventName} (${roleplaySession.eventCode}), a ${eventCategory.replace(/_/g, " ")} event.

Scenario: ${scenarioData.scenario.substring(0, 500)}...

PIs to address: ${piList}

The transcript is from speech-to-text — focus on substance, not transcription errors. Be STRICT and realistic like an actual DECA judge.

CRITICAL SCORING RULES:
- A response of just a few words or sentences should score VERY LOW (0-20 total). Do NOT give high scores for minimal effort.
- If the student barely addresses any PIs, score each PI in the "Little/No Value" range.
- A perfect score requires thorough, professional, well-structured responses addressing ALL performance indicators.
- Score proportionally to the depth and quality of the response. Short or vague answers = low scores.
- Be constructive in feedback but DO NOT inflate scores.

Return ONLY a JSON object (no markdown, no code blocks).

${scoringInstructions}`,
            messages: [
              {
                role: "user",
                content: `Student's roleplay transcript:\n\n${fullTranscript}`,
              },
            ],
          });

          messageStream.on("text", (text) => {
            fullText += text;
            controller.enqueue(encoder.encode(" "));
          });

          await messageStream.finalMessage();

          let result;
          try {
            result = JSON.parse(fullText);
          } catch {
            try {
              const jsonMatch = fullText.match(/\{[\s\S]*\}/);
              result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch {
              result = null;
            }
          }

          if (!result) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to parse evaluation. Please try again." })));
            controller.close();
            return;
          }

          // Update session in DB
          await prisma.roleplaySession.update({
            where: { id: sessionId },
            data: {
              messagesJson: JSON.stringify(
                fullTranscript ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }] : []
              ),
              scoreJson: JSON.stringify(result),
              completed: true,
            },
          });

          await awardXp(userId, "COMPLETE_ROLEPLAY", { eventCode: roleplaySession.eventCode });
          await checkAndAwardBadges(userId);

          controller.enqueue(encoder.encode(JSON.stringify(result)));
          controller.close();
        } catch (err: any) {
          console.error("Roleplay score error:", err.message);
          controller.enqueue(encoder.encode(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." })));
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
