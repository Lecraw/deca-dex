import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

// Real DECA scoring structures by event category
const SCORING_CONFIG = {
  PRINCIPLES_EVENTS: {
    piCount: 4,
    piMaxPoints: 20, // each PI scored 0-20 (Little/No Value: 0-5, Below: 6-10, Meets: 11-15, Exceeds: 16-20)
    overallImpressionMax: 20,
    // Total: 4×20 + 20 = 100
    twentyFirstCenturySkills: [
      "Reason effectively and use systems thinking",
      "Make judgments and decisions, and solve problems",
      "Communicate clearly",
      "Show evidence of creativity",
    ],
  },
  INDIVIDUAL_SERIES: {
    piCount: 5,
    piMaxPoints: 14, // each PI scored 0-14 (Little/No Value: 0-4, Below: 5-8, Meets: 9-11, Exceeds: 12-14)
    // 21st century skills: 4 × 6 = 24, Overall Impression: 6
    // Total: 5×14 + 4×6 + 6 = 70 + 24 + 6 = 100
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
    piMaxPoints: 10, // each PI scored 0-10
    // Supplemental: Clarity 6, Organization 6, Mature Judgment 6, Effective Participation 6, Overall 6
    // Total: 7×10 + 5×6 = 70 + 30 = 100
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
  // Default to principles
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

    // Get event details from DB
    const event = await prisma.decaEvent.findUnique({ where: { code: eventCode } });
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    const config = getScoringConfig(event.category);

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: `You are a DECA competition scenario generator for the ${event.name} (${eventCode}) event.

This is a ${event.category.replace(/_/g, " ")} event in the ${event.cluster.replace(/_/g, " ")} career cluster.

Generate a realistic DECA roleplay scenario that matches exactly how real DECA competitions work.

The scenario MUST follow this exact format:
1. A detailed business situation written in 2nd person ("You are to assume the role of...")
2. Clearly state the participant's role and who the judge is playing (the second party)
3. Provide a realistic business context with specific details (company names, numbers, situations)
4. Include 2-3 paragraphs of detailed context
5. End by explaining the roleplay setup: "You will present to [judge's role] in a role-play to take place in [location]. [Judge's role] will begin by greeting you and asking to hear your [analysis/ideas/solution]."

You MUST generate exactly ${config.piCount} Performance Indicators. These should be real DECA-style performance indicators — specific knowledge and skills the student must demonstrate. They should be phrased as action statements (e.g., "Explain the nature of channels of distribution", "Identify factors affecting a business's profit", "Determine factors affecting business risk").

Performance indicators should come from the ${event.cluster.replace(/_/g, " ")} career cluster and be appropriate for the ${event.name} event.

Also generate exactly 3 follow-up questions the judge should ask after the student's initial presentation. These should probe deeper into the student's understanding and relate to the scenario and PIs.

Return JSON in this exact format:
{
  "scenario": "The full scenario text...",
  "performanceIndicators": [${Array(config.piCount).fill('"PI text"').join(", ")}],
  "judgeFollowUpQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`,
        messages: [
          {
            role: "user",
            content: `Generate a roleplay scenario with ${config.piCount} performance indicators for the ${event.name} (${eventCode}) DECA event.`,
          },
        ],
      });
    } catch (err: any) {
      console.error("Anthropic API error (roleplay start):", err.message);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let scenarioData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      scenarioData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      scenarioData = null;
    }

    if (!scenarioData?.scenario || !scenarioData?.performanceIndicators) {
      return new Response(
        JSON.stringify({ error: "Failed to generate scenario. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add 21st century skills and event metadata
    const twentyFirstCenturySkills = config.twentyFirstCenturySkills;

    // Save to database
    const roleplaySession = await prisma.roleplaySession.create({
      data: {
        userId: session.user.id,
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

    return new Response(
      JSON.stringify({ sessionId: roleplaySession.id }),
      { headers: { "Content-Type": "application/json" } }
    );
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

    // Build scoring instructions based on event type
    let scoringInstructions = "";

    if (eventCategory === "PRINCIPLES_EVENTS") {
      scoringInstructions = `
Score each Performance Indicator on a 0-20 scale:
- Exceeds Expectations (16-20): Extremely professional, greatly exceeds business standards, top 10%
- Meets Expectations (11-15): Acceptable and effective, meets minimal business standards, 70-89th percentile
- Below Expectations (6-10): Limited effectiveness, below minimal business standards, 50-69th percentile
- Little/No Value (0-5): Little or no effectiveness, needs significant training, 0-49th percentile

Also score "Overall Impression & Response to Questions" on 0-20.

Total should be out of 100 (4 PIs × 20 + Overall Impression 20).

Return JSON:
{
  "totalScore": <number 0-100>,
  "overallFeedback": "2-3 sentence overall assessment",
  "piScores": [
    { "indicator": "PI text", "score": <0-20>, "maxPoints": 20, "feedback": "specific feedback", "level": "Exceeds/Meets/Below/Little-No Value" }
  ],
  "twentyFirstCenturyScores": [
    { "skill": "Overall Impression & Responses to Questions", "score": <0-20>, "maxPoints": 20 }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}`;
    } else if (eventCategory === "INDIVIDUAL_SERIES") {
      scoringInstructions = `
Score each Performance Indicator on a 0-14 scale:
- Exceeds Expectations (12-14): Extremely professional, greatly exceeds business standards
- Meets Expectations (9-11): Acceptable and effective, meets minimal business standards
- Below Expectations (5-8): Limited effectiveness, below minimal business standards
- Little/No Value (0-4): Little or no effectiveness

Score each 21st Century Skill on a 0-6 scale:
- Exceeds (5-6), Meets (4), Below (2-3), Little/No Value (0-1)

Also score "Overall Impression & Response to Questions" on 0-6.

Total should be out of 100 (5 PIs × 14 = 70, 4 skills × 6 = 24, overall 6).

Return JSON:
{
  "totalScore": <number 0-100>,
  "overallFeedback": "2-3 sentence overall assessment",
  "piScores": [
    { "indicator": "PI text", "score": <0-14>, "maxPoints": 14, "feedback": "specific feedback", "level": "Exceeds/Meets/Below/Little-No Value" }
  ],
  "twentyFirstCenturyScores": [
    { "skill": "Reason effectively and use systems thinking", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Make judgments and decisions, and solve problems", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Communicate clearly", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Show evidence of creativity", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Overall Impression & Responses to Questions", "score": <0-6>, "maxPoints": 6 }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}`;
    } else {
      // Team Decision Making
      scoringInstructions = `
Score each Performance Indicator on a 0-10 scale:
- Exceeds Expectations (9-10): Extremely professional
- Meets Expectations (7-8): Acceptable and effective
- Below Expectations (4-6): Limited effectiveness
- Little/No Value (0-3): Little or no effectiveness

Score supplemental categories on a 0-6 scale:
- Clarity of expression
- Organization of ideas
- Evidence of mature judgment
- Effective participation of both team members (score based on individual)
- Overall impression & responses to questions

Total should be out of 100 (7 PIs × 10 = 70, 5 categories × 6 = 30).

Return JSON:
{
  "totalScore": <number 0-100>,
  "overallFeedback": "2-3 sentence overall assessment",
  "piScores": [
    { "indicator": "PI text", "score": <0-10>, "maxPoints": 10, "feedback": "specific feedback", "level": "Exceeds/Meets/Below/Little-No Value" }
  ],
  "twentyFirstCenturyScores": [
    { "skill": "Clarity of expression", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Organization of ideas", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Evidence of mature judgment", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Effective participation", "score": <0-6>, "maxPoints": 6 },
    { "skill": "Overall Impression & Responses to Questions", "score": <0-6>, "maxPoints": 6 }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}`;
    }

    const piList = pis.map((p: string, i: number) => `  PI ${i + 1}: ${p}`).join("\n");

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: `You are an experienced DECA judge at ICDC level, evaluating a student's roleplay performance for the ${scenarioData.eventName} (${roleplaySession.eventCode}) event.

This is a ${eventCategory.replace(/_/g, " ")} event.

The student was given this scenario:
${scenarioData.scenario}

Performance Indicators they needed to address:
${piList}

The student spoke their response aloud (transcribed via speech-to-text). Evaluate them exactly as a real DECA judge would, using the official DECA evaluation form scoring.

Important: The transcript may have minor speech-to-text errors — focus on the substance and ideas, not transcription artifacts. However, DO evaluate their communication clarity, professionalism, and organization as you would judge someone speaking in person.

Consider:
- Did they address each performance indicator? Did they define it AND apply it to the scenario?
- Were they professional and confident in their delivery?
- Did they demonstrate critical thinking and problem-solving?
- Were their answers to follow-up questions thorough?
- Did they show creativity and go above and beyond?

${scoringInstructions}`,
        messages: [
          {
            role: "user",
            content: `Here is the full transcript of the student's roleplay session:\n\n${fullTranscript}`,
          },
        ],
      });
    } catch (err: any) {
      console.error("Anthropic API error (roleplay score):", err.message);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let result;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Failed to parse evaluation" }),
        { status: 500 }
      );
    }

    // Update session in DB
    await prisma.roleplaySession.update({
      where: { id: sessionId },
      data: {
        messagesJson: JSON.stringify(
          body.fullTranscript ? [{ role: "user", content: body.fullTranscript, timestamp: new Date().toISOString() }] : []
        ),
        scoreJson: JSON.stringify(result),
        completed: true,
      },
    });

    // Award XP
    await awardXp(session.user.id, "COMPLETE_ROLEPLAY", { eventCode: roleplaySession.eventCode });
    await checkAndAwardBadges(session.user.id);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
