import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, overrides = [] } = body;

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
  const eventSections = JSON.parse(event.sectionsJson) as any[];
  const eventGuidelines = JSON.parse(event.guidelinesJson);
  const eventRubric = JSON.parse(event.rubricJson);

  // Build project content for AI review
  let projectContent = `Project Title: ${project.title}\n`;
  if (project.businessIdea) {
    projectContent += `Business Idea: ${project.businessIdea}\n\n`;
  }

  if (project.slides.length > 0) {
    projectContent += "=== SLIDES ===\n";
    for (const slide of project.slides) {
      projectContent += `\nSlide ${slide.order + 1}: ${slide.title}\n`;
      const content =
        typeof slide.contentJson === "string"
          ? JSON.parse(slide.contentJson)
          : slide.contentJson;
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
      projectContent += `\nSection: ${section.title} (${section.wordCount} words)\n`;
      const plainText = section.bodyHtml.replace(/<[^>]*>/g, "");
      projectContent += `${plainText}\n`;
    }
  }

  if (project.uploadedFileText) {
    const uploadedPages = project.uploadedFileText.split("\n\n--- Page Break ---\n\n");
    projectContent += `\n=== UPLOADED FILE (${project.uploadedFileName}) — ${uploadedPages.length} total pages ===\n`;
    projectContent += `NOTE: This PDF may include supplemental pages (e.g. Statement of Assurances, Academic Integrity forms, title pages) that do NOT count toward the slide/page limit. Only count actual presentation/content slides when checking slide count compliance.\n\n`;
    uploadedPages.forEach((page, i) => {
      projectContent += `--- Page ${i + 1} of ${uploadedPages.length} ---\n${page}\n\n`;
    });
  }

  const guidelinesText = Array.isArray(eventGuidelines)
    ? eventGuidelines.join("\n")
    : [
        ...(eventGuidelines.requirements || []),
        ...(eventGuidelines.formatting || []),
        ...(eventGuidelines.tips || []),
      ].join("\n");

  const systemPrompt = `You are a DECA competition compliance reviewer for the "${event.name}" (${event.code}) event.

Event type: ${event.eventType}
${event.maxSlides ? `Maximum slides allowed: ${event.maxSlides}` : ""}
${event.maxPages ? `Maximum pages allowed: ${event.maxPages}` : ""}
${event.presentationMin ? `Presentation time: ${event.presentationMin} minutes` : ""}
Team size: ${event.teamMin}${event.teamMax > event.teamMin ? `-${event.teamMax}` : ""} members

Required sections:
${eventSections.map((s: any) => `- ${s.title}: ${s.description || ""}`).join("\n")}

Event guidelines:
${guidelinesText}

Rubric categories:
${eventRubric.map((r: any) => `- ${r.name} (${r.maxPoints} pts): ${r.description}`).join("\n")}

Analyze the student's project. Remember these are high school students — be encouraging and constructive. Only mark a check as FAILED for genuine issues, not stylistic preferences or minor wording nitpicks.

Check for:
1. Whether required sections are present (pass if they exist with any reasonable content)
2. Slide/page count compliance (IMPORTANT: do NOT count supplemental pages like Statement of Assurances, Academic Integrity forms, cover pages, or appendix pages toward the slide limit)
3. Major structural issues (only fail for truly missing critical elements)
4. Content alignment with event requirements

Mark a check as PASSED if the student made a reasonable attempt. Use "warning" severity for suggestions and improvements — reserve "error" only for hard rule violations (wrong page count, missing required sections entirely).

Return your analysis as JSON with this exact structure:
{
  "score": <number 0-100 representing overall DECA readiness>,
  "checks": [
    {
      "name": "Check name",
      "passed": true/false,
      "severity": "info" | "warning" | "error",
      "message": "Specific feedback about this check"
    }
  ],
  "summary": "2-3 sentence encouraging overall assessment"
}

Include 8-12 checks. Most checks should PASS for a project with reasonable effort.

SCORING GUIDE:
- A project with all sections present and decent content: 80-95
- A project with minor gaps or areas to improve: 65-80
- A project missing multiple required sections: 45-65
- Only score below 45 if the project is fundamentally incomplete

Be generous with the score — the goal is to motivate students, not discourage them. Frame the summary positively.${overrides.length > 0 ? `\n\nIMPORTANT: The student has overridden the following checks (they believe these are not applicable or they've handled them outside this project). Still include these checks in your response, but mark them as PASSED:\n${overrides.join("\n")}` : ""}`;

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
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Please review this project for DECA compliance:\n\n${projectContent}`,
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
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Failed to parse compliance response" })));
          controller.close();
          return;
        }

        const score = Math.max(0, Math.min(100, Math.round(result.score)));
        const checks = result.checks || [];

        await prisma.project.update({
          where: { id: projectId },
          data: {
            complianceJson: JSON.stringify({ score, checks, summary: result.summary, overrides }),
            readinessScore: score,
          },
        });

        await awardXp(userId, "RUN_COMPLIANCE", { projectId });
        await checkAndAwardBadges(userId);

        controller.enqueue(encoder.encode(JSON.stringify({ score, maxScore: 100, checks, summary: result.summary, overrides })));
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
