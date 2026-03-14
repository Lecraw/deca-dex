import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { ideaGeneratorSystem } from "@/lib/ai/prompts";
import { awardXp } from "@/lib/gamification/xp";
import type { DecaEventData } from "@/types/deca";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { eventId, prompt: userPrompt, count = 3 } = body;

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = await prisma.decaEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const eventData: DecaEventData = {
    code: event.code,
    name: event.name,
    cluster: event.cluster,
    category: event.category,
    eventType: event.eventType as any,
    maxSlides: event.maxSlides ?? undefined,
    maxPages: event.maxPages ?? undefined,
    presentationMin: event.presentationMin ?? undefined,
    hasExam: event.hasExam,
    teamMin: event.teamMin,
    teamMax: event.teamMax,
    description: event.description,
    rubric: JSON.parse(event.rubricJson),
    guidelines: JSON.parse(event.guidelinesJson),
    sections: JSON.parse(event.sectionsJson),
  };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: ideaGeneratorSystem(eventData),
    messages: [
      {
        role: "user",
        content:
          userPrompt ||
          `Generate ${count} creative and competition-winning business ideas for the ${event.name} DECA event. Make them innovative, feasible for high school students, and aligned with current trends.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Try to extract JSON from the response
  let ideas;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    ideas = [{ name: "Error", pitch: text, problem: "", targetMarket: "", revenueModel: "", uniqueness: "" }];
  }

  // Award XP for generating ideas
  await awardXp(session.user.id, "GENERATE_IDEAS", { eventId });

  return NextResponse.json({ ideas });
}
