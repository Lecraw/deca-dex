import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

export const maxDuration = 25;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId } = body;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      event: true,
      slides: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const event = project.event;

  // Build compact project summary
  let projectContent = `Title: ${project.title}`;
  if (project.businessIdea) projectContent += `\nIdea: ${project.businessIdea}`;
  if (project.description) projectContent += `\nDesc: ${project.description}`;

  if (project.slides.length > 0) {
    projectContent += "\nSlides: ";
    projectContent += project.slides.map((s) => s.title).join(", ");
  }

  if (project.sections.length > 0) {
    projectContent += "\nSections: ";
    projectContent += project.sections.map((s) => s.title).join(", ");
  }

  if (project.uploadedFileText) {
    projectContent += `\nUploaded content: ${project.uploadedFileText.substring(0, 800)}`;
  }

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: `You are a DECA presentation coach for the ${event.name} (${event.code}) event. Return ONLY a JSON object (no markdown, no code blocks, no extra text) with exactly this structure:

{"generalTips":[{"tip":"text","category":"DELIVERY|STRUCTURE|JUDGES|CONFIDENCE|TIMING"}],"creativeHooks":[{"line":"phrase","context":"when to use"}],"propIdeas":[{"prop":"what","howToUse":"how"}],"graphicIdeas":[{"visual":"description","slide":"which slide","why":"reasoning"}]}

Generate exactly: 5 general tips, 5 creative hooks, 3 prop ideas, 3 graphic ideas. Keep each tip/hook/idea concise (1-2 sentences max). Creative hooks should be clever wordplay tied to the specific business.`,
      messages: [
        {
          role: "user",
          content: projectContent,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `API error: ${err.message}` },
      { status: 502 }
    );
  }

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  if (!rawText) {
    return NextResponse.json(
      { error: "Empty AI response. Please try again." },
      { status: 500 }
    );
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch {
    try {
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        result = JSON.parse(codeBlockMatch[1].trim());
      } else {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
    } catch {
      result = null;
    }
  }

  if (!result) {
    return NextResponse.json(
      { error: `Parse failed. Stop: ${message.stop_reason}. Start: ${rawText.substring(0, 150)}` },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
