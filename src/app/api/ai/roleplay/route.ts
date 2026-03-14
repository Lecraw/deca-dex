import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { action, eventCode, scenario, response } = body;

  // Generate a roleplay scenario
  if (action === "generate_scenario") {
    if (!eventCode) {
      return new Response(JSON.stringify({ error: "eventCode required" }), { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a DECA competition scenario generator for the ${eventCode} roleplay event.

Generate a realistic business roleplay scenario that a DECA student would encounter at a competition.

The scenario MUST include:
1. A detailed business situation written in 2nd person ("You are...")
2. The student's role and who they are speaking to
3. The context, situation, and what they need to address (2-3 paragraphs)
4. Exactly 4 Key Performance Indicators (KPIs) that the judge will use to evaluate the student's response

Return the response as JSON in this exact format:
{
  "scenario": "The full scenario text here...",
  "kpis": [
    "First KPI the student will be evaluated on",
    "Second KPI the student will be evaluated on",
    "Third KPI the student will be evaluated on",
    "Fourth KPI the student will be evaluated on"
  ]
}

The KPIs should be specific, measurable performance indicators relevant to the scenario (e.g., "Explain two benefits of the proposed marketing strategy", "Recommend a pricing approach and justify it"). They should match real DECA roleplay KPI style.`,
      messages: [
        {
          role: "user",
          content: `Generate a roleplay scenario with 4 KPIs for the ${eventCode} DECA event.`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let scenarioData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      scenarioData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      scenarioData = null;
    }

    if (scenarioData?.scenario && scenarioData?.kpis) {
      return new Response(
        JSON.stringify({
          scenario: scenarioData.scenario,
          kpis: scenarioData.kpis,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Fallback: treat entire response as scenario text (no KPIs parsed)
    return new Response(
      JSON.stringify({ scenario: rawText, kpis: [] }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Evaluate the student's response
  if (action === "evaluate_response") {
    const { kpis } = body;
    if (!eventCode || !scenario || !response) {
      return new Response(
        JSON.stringify({ error: "eventCode, scenario, and response are required" }),
        { status: 400 }
      );
    }

    const kpiList = Array.isArray(kpis) && kpis.length > 0
      ? kpis.map((k: string, i: number) => `  KPI ${i + 1}: ${k}`).join("\n")
      : "  No specific KPIs provided — evaluate on general business knowledge and communication.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are an experienced DECA judge evaluating a student's roleplay response for the ${eventCode} event.

The student was given a scenario with specific Key Performance Indicators (KPIs) and wrote out what they would say. Evaluate their response as if you were a real DECA judge at ICDC.

The KPIs for this scenario are:
${kpiList}

For each KPI, evaluate whether the student adequately addressed it. Also consider:
- Professionalism and communication skills
- Use of business terminology and concepts
- Problem-solving approach
- Persuasiveness and confidence in their response

Return your evaluation as JSON:
{
  "score": <number 0-100>,
  "overallFeedback": "2-3 sentence overall assessment",
  "kpiScores": [
    { "kpi": "the KPI text", "score": <0-25>, "feedback": "how they did on this KPI" }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}

Each KPI is scored out of 25 points (4 KPIs × 25 = 100 total). The overall score should be the sum of KPI scores.`,
      messages: [
        {
          role: "user",
          content: `SCENARIO:\n${scenario}\n\nKPIs:\n${kpiList}\n\nSTUDENT'S RESPONSE:\n${response}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

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

    // Save to database
    await prisma.roleplaySession.create({
      data: {
        userId: session.user.id,
        eventCode,
        scenarioJson: JSON.stringify({ description: scenario }),
        messagesJson: JSON.stringify([
          { role: "user", content: response, timestamp: new Date().toISOString() },
        ]),
        scoreJson: JSON.stringify(result),
        completed: true,
      },
    });

    // Award XP
    await awardXp(session.user.id, "COMPLETE_ROLEPLAY", { eventCode });
    await checkAndAwardBadges(session.user.id);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
