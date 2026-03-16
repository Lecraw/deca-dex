import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ideaGeneratorSystem } from "@/lib/ai/prompts";
import { awardXp } from "@/lib/gamification/xp";
import type { DecaEventData } from "@/types/deca";
import Anthropic from "@anthropic-ai/sdk";

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

        messageStream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(" "));
        });

        await messageStream.finalMessage();

        let ideas;
        try {
          const jsonMatch = fullText.match(/\[[\s\S]*\]/);
          ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          ideas = [{ name: "Error", pitch: fullText, problem: "", targetMarket: "", revenueModel: "", uniqueness: "" }];
        }

        await awardXp(userId, "GENERATE_IDEAS", { eventId });

        controller.enqueue(encoder.encode(JSON.stringify({ ideas })));
        controller.close();
      } catch (err: any) {
        console.error("Generate idea error:", err.message);
        controller.enqueue(encoder.encode(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache" },
  });
}
