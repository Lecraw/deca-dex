import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { feedbackSystem } from "@/lib/ai/prompts";
import type { DecaEventData } from "@/types/deca";

export const maxDuration = 25;

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

  let message;
  try {
    message = await anthropic.messages.create({
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
  } catch (err: any) {
    console.error("Anthropic API error (feedback):", err.message);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let feedbackItems;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
    feedbackItems = parsed.items || [];
  } catch {
    feedbackItems = [
      {
        type: "GENERAL",
        severity: "INFO",
        content: text,
        suggestion: "",
      },
    ];
  }

  // Save feedback items to database
  for (const item of feedbackItems) {
    await prisma.aiFeedback.create({
      data: {
        projectId,
        userId: session.user.id,
        slideId: slideId || null,
        sectionId: sectionId || null,
        feedbackType: item.type || "GENERAL",
        severity: item.severity || "INFO",
        content: item.content,
        suggestion: item.suggestion || null,
      },
    });
  }

  return NextResponse.json({ feedback: feedbackItems });
}
