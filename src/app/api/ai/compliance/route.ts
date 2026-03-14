import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

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

  // Build guidelines string
  const guidelinesText = Array.isArray(eventGuidelines)
    ? eventGuidelines.join("\n")
    : [
        ...(eventGuidelines.requirements || []),
        ...(eventGuidelines.formatting || []),
        ...(eventGuidelines.tips || []),
      ].join("\n");

  // Call AI for comprehensive compliance review
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

Analyze the student's project and check for:
1. Whether all required sections are present and have substantive content
2. Whether the content aligns with DECA event requirements and rubric expectations
3. Content quality issues (too vague, missing data/evidence, off-topic)
4. Structural issues (missing bibliography, poor organization)
5. Slide/page count compliance (IMPORTANT: do NOT count supplemental pages like Statement of Assurances, Academic Integrity forms, cover pages, or appendix pages toward the slide limit — only count actual content/presentation slides)
6. Whether the project would score well against the rubric categories

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
  "summary": "2-3 sentence overall assessment"
}

Include 8-15 checks covering structural requirements, content quality, and rubric alignment. Be specific and actionable. Score honestly — a project with placeholder or minimal content should score low.`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please review this project for DECA compliance:\n\n${projectContent}`,
        },
      ],
    });
  } catch (err: any) {
    console.error("Anthropic API error (compliance):", err.message);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

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
    return NextResponse.json(
      { error: "Failed to parse compliance response" },
      { status: 500 }
    );
  }

  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const checks = result.checks || [];

  // Update project compliance
  await prisma.project.update({
    where: { id: projectId },
    data: {
      complianceJson: JSON.stringify({ score, checks, summary: result.summary }),
      readinessScore: score,
    },
  });

  // Award XP for running compliance check
  await awardXp(session.user.id, "RUN_COMPLIANCE", { projectId });
  await checkAndAwardBadges(session.user.id);

  return NextResponse.json({ score, maxScore: 100, checks, summary: result.summary });
}
