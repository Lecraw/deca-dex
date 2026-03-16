import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { judgeSystem } from "@/lib/ai/prompts";
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
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

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

  // Build project content for review
  let projectContent = `Project: ${project.title}\n`;
  if (project.businessIdea) {
    projectContent += `Business Idea: ${project.businessIdea}\n\n`;
  }

  if (project.slides.length > 0) {
    projectContent += "=== SLIDES ===\n";
    for (const slide of project.slides) {
      projectContent += `\nSlide ${slide.order + 1}: ${slide.title}\n`;
      const content = typeof slide.contentJson === "string" ? JSON.parse(slide.contentJson) : slide.contentJson;
      if (content?.blocks) {
        for (const block of content.blocks) {
          if (block.content) projectContent += `${block.content}\n`;
        }
      }
    }
  }

  if (project.sections.length > 0) {
    projectContent += "=== REPORT SECTIONS ===\n";
    for (const section of project.sections) {
      projectContent += `\nSection: ${section.title}\n`;
      const plainText = section.bodyHtml.replace(/<[^>]*>/g, "");
      projectContent += `${plainText}\n`;
    }
  }

  if (project.uploadedFileText) {
    const uploadedPages = project.uploadedFileText.split("\n\n--- Page Break ---\n\n");
    projectContent += `\n=== UPLOADED FILE (${project.uploadedFileName}) — ${uploadedPages.length} total pages ===\n`;
    projectContent += `NOTE: This PDF may include supplemental pages (e.g. Statement of Assurances, Academic Integrity forms) that are NOT presentation content slides.\n\n`;
    uploadedPages.forEach((page: string, i: number) => {
      projectContent += `--- Page ${i + 1} of ${uploadedPages.length} ---\n${page}\n\n`;
    });
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
          model: "claude-3-haiku-20240307",
          max_tokens: 2048,
          system: judgeSystem(eventData),
          messages: [
            {
              role: "user",
              content: `Please score this project:\n\n${projectContent}`,
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
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          result = null;
        }

        if (!result) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to parse judge response" })));
          controller.close();
          return;
        }

        // Save score
        const score = await prisma.judgeScore.create({
          data: {
            projectId,
            totalScore: result.totalScore,
            maxScore: result.maxScore,
            categoriesJson: JSON.stringify(result.categories),
            overallNotes: result.overallNotes || "",
            strengths: JSON.stringify(result.strengths || []),
            improvements: JSON.stringify(result.improvements || []),
          },
        });

        // Award XP
        await awardXp(userId, "RUN_JUDGE_SIM", { projectId, scoreId: score.id });
        await checkAndAwardBadges(userId);

        controller.enqueue(encoder.encode(JSON.stringify({ score: result, scoreId: score.id })));
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
