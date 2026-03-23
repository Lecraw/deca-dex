import { NextRequest, NextResponse } from "next/server";
import { getSessionOrToken } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await getSessionOrToken(req);
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

Your job is to check whether the project COMPLIES with the DECA guidelines — NOT to grade or score it. This is a pass/fail checklist, not a rubric evaluation. The judge simulator handles scoring separately.

Check for:
1. Whether required sections are present
2. Slide/page count compliance (IMPORTANT: do NOT count supplemental pages like Statement of Assurances, Academic Integrity forms, cover pages, or appendix pages toward the slide limit)
3. Formatting requirements (page limits, structure)
4. Content alignment with event requirements

Each check is either COMPLIANT (passed: true) or NOT COMPLIANT (passed: false). Use "warning" severity for minor guideline deviations and "error" for clear violations (exceeding page/slide limits, missing required sections entirely).

Return your analysis as JSON with this exact structure:
{
  "allCompliant": true/false,
  "checks": [
    {
      "name": "Check name",
      "passed": true/false,
      "severity": "info" | "warning" | "error",
      "message": "What is compliant or what needs to change"
    }
  ],
  "summary": "2-3 sentence overall compliance assessment"
}

Do NOT include a numeric score. Include 8-12 checks. Set "allCompliant" to true only if every check passes.

Be encouraging — these are high school students. Frame non-compliant items as specific things to fix, not failures.${overrides.length > 0 ? `\n\nIMPORTANT: The student has overridden the following checks (they believe these are not applicable or they've handled them outside this project). Still include these checks in your response, but mark them as PASSED:\n${overrides.join("\n")}` : ""}`;

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

        const checks = result.checks || [];
        const allCompliant = checks.length > 0 && checks.every((c: any) => c.passed);

        await prisma.project.update({
          where: { id: projectId },
          data: {
            complianceJson: JSON.stringify({ allCompliant, checks, summary: result.summary, overrides }),
            readinessScore: null,
          },
        });

        await awardXp(userId, "RUN_COMPLIANCE", { projectId });
        await checkAndAwardBadges(userId);

        controller.enqueue(encoder.encode(JSON.stringify({ allCompliant, checks, summary: result.summary, overrides })));
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
