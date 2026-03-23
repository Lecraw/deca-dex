import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { researchSystem } from "@/lib/ai/prompts";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import type { DecaEventData } from "@/types/deca";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, researchId, userPrompt } = body;

  if (!projectId || !researchId) {
    return NextResponse.json(
      { error: "Missing projectId or researchId" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { event: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const researchDoc = await prisma.researchDocument.findFirst({
    where: { id: researchId, projectId },
  });

  if (!researchDoc) {
    return NextResponse.json(
      { error: "Research document not found" },
      { status: 404 }
    );
  }

  const event = project.event;
  const eventData: DecaEventData = {
    code: event.code,
    name: event.name,
    cluster: event.cluster,
    category: event.category,
    eventType: event.eventType as DecaEventData["eventType"],
    maxSlides: event.maxSlides ?? undefined,
    maxPages: event.maxPages ?? undefined,
    presentationMin: event.presentationMin ?? undefined,
    prepMin: event.prepMin ?? undefined,
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
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        let fullText = "";

        const systemPrompt = researchSystem(
          eventData,
          researchDoc.title,
          researchDoc.template,
          project.businessIdea || "Not yet defined"
        );

        const userMessage = userPrompt
          ? `Please conduct research on "${researchDoc.title}" for my project. Additional context: ${userPrompt}`
          : `Please conduct research on "${researchDoc.title}" for my project "${project.title}".`;

        const messageStream = client.messages.stream({
          model: "claude-3-haiku-20240307",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        messageStream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(" "));
        });

        await messageStream.finalMessage();

        let result;
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          result = null;
        }

        if (!result) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: "Failed to parse research response" })
            )
          );
          controller.close();
          return;
        }

        await prisma.researchDocument.update({
          where: { id: researchId },
          data: {
            contentJson: JSON.stringify(result),
            status: "COMPLETED",
          },
        });

        await awardXp(userId, "GENERATE_IDEAS", { projectId });
        await checkAndAwardBadges(userId);

        controller.enqueue(encoder.encode(JSON.stringify(result)));
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ error: `API error: ${err.message}` })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}
