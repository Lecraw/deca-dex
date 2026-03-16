import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackSystem } from "@/lib/ai/prompts";
import type { DecaEventData } from "@/types/deca";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, content, slideId, sectionId } = body;

  if (!projectId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { event: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const event = project.event;
  const eventData: DecaEventData = {
    code: event.code,
    name: event.name,
    cluster: event.cluster,
    category: event.category,
    eventType: event.eventType as any,
    hasExam: event.hasExam,
    teamMin: event.teamMin,
    teamMax: event.teamMax,
    description: event.description,
    rubric: JSON.parse(event.rubricJson),
    guidelines: JSON.parse(event.guidelinesJson),
    sections: JSON.parse(event.sectionsJson),
  };

  const userId = session.user.id;

  // Use streaming to avoid Netlify timeout
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        let fullText = "";

        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: feedbackSystem(eventData),
          messages: [
            {
              role: "user",
              content: `Please review this content and provide feedback:\n\n${content}`,
            },
          ],
        });

        messageStream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(" "));
        });

        await messageStream.finalMessage();

        let feedbackItems;
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
          feedbackItems = parsed.items || [];
        } catch {
          feedbackItems = [
            {
              type: "GENERAL",
              severity: "INFO",
              content: fullText,
              suggestion: "",
            },
          ];
        }

        // Save feedback items to database
        for (const item of feedbackItems) {
          await prisma.aiFeedback.create({
            data: {
              projectId,
              userId,
              slideId: slideId || null,
              sectionId: sectionId || null,
              feedbackType: item.type || "GENERAL",
              severity: item.severity || "INFO",
              content: item.content,
              suggestion: item.suggestion || null,
            },
          });
        }

        controller.enqueue(encoder.encode(JSON.stringify({ feedback: feedbackItems })));
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: `API error: ${err.message}` })));
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
