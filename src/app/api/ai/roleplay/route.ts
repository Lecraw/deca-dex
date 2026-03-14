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

Generate a realistic business roleplay scenario that a DECA student would encounter at a competition. The scenario should:
- Be specific and detailed enough for the student to formulate a response
- Include a clear business situation or problem
- Identify who the student is (their role) and who they're speaking to
- Be appropriate for high school students
- Be challenging but fair

Write the scenario in 2nd person ("You are..."). Include the context, the situation, and what the student needs to address. Keep it to 2-3 paragraphs.

Return ONLY the scenario text, no JSON or formatting.`,
      messages: [
        {
          role: "user",
          content: `Generate a roleplay scenario for the ${eventCode} DECA event.`,
        },
      ],
    });

    const scenarioText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return new Response(
      JSON.stringify({ scenario: scenarioText }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Evaluate the student's response
  if (action === "evaluate_response") {
    if (!eventCode || !scenario || !response) {
      return new Response(
        JSON.stringify({ error: "eventCode, scenario, and response are required" }),
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are an experienced DECA judge evaluating a student's roleplay response for the ${eventCode} event.

The student was given a scenario and wrote out what they would say. Evaluate their response as if you were a real DECA judge at ICDC.

Consider:
- How well they addressed the business situation
- Professionalism and communication skills
- Use of business terminology and concepts
- Problem-solving approach
- Persuasiveness and confidence in their response
- Whether they covered all key aspects of the scenario

Return your evaluation as JSON:
{
  "score": <number 0-100>,
  "overallFeedback": "2-3 sentence overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}`,
      messages: [
        {
          role: "user",
          content: `SCENARIO:\n${scenario}\n\nSTUDENT'S RESPONSE:\n${response}`,
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
