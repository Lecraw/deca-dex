import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";

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

  // Build project content summary
  let projectContent = `Project Title: ${project.title}\n`;
  if (project.businessIdea) {
    projectContent += `Business Idea: ${project.businessIdea}\n`;
  }
  if (project.description) {
    projectContent += `Description: ${project.description}\n`;
  }

  if (project.slides.length > 0) {
    projectContent += "\n=== SLIDES ===\n";
    for (const slide of project.slides) {
      projectContent += `Slide ${slide.order + 1}: ${slide.title}\n`;
      const content =
        typeof slide.contentJson === "string"
          ? JSON.parse(slide.contentJson)
          : slide.contentJson;
      if (content?.blocks) {
        for (const block of content.blocks) {
          if (block.content) projectContent += `  ${block.content}\n`;
        }
      }
    }
  }

  if (project.sections.length > 0) {
    projectContent += "\n=== REPORT SECTIONS ===\n";
    for (const section of project.sections) {
      projectContent += `Section: ${section.title}\n`;
      const plainText = section.bodyHtml.replace(/<[^>]*>/g, "");
      projectContent += `  ${plainText.substring(0, 500)}\n`;
    }
  }

  if (project.uploadedFileText) {
    projectContent += `\n=== UPLOADED PRESENTATION ===\n`;
    projectContent += project.uploadedFileText.substring(0, 2000) + "\n";
  }

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are an expert DECA presentation coach helping a student prepare for the ${event.name} (${event.code}) event.

The student has a project/presentation they need to present to DECA judges. Your job is to provide four types of tips:

1. GENERAL PRESENTATION TIPS: Practical advice on delivery, body language, structure, time management, and how to impress DECA judges specifically. These should be actionable and specific to DECA competition presenting (not generic public speaking advice). Think about what separates a state-level presenter from an ICDC winner.

2. CREATIVE HOOKS: Clever lines, puns, wordplay, memorable phrases, or attention-grabbing openers that are specifically tied to the student's business idea/project. These should be things they could actually say during their presentation to make it memorable. Think about what would make a judge smile or remember this presentation. Be creative and fun but still professional.

3. PROP IDEAS: Physical props or visual aids the student could bring to their presentation to make it more engaging and memorable. Include HOW to use each prop effectively (when to reveal it, what to say when showing it). Props should be practical, easy to bring, and directly related to the business/project.

4. GRAPHIC & VISUAL IDEAS: Specific graphics, charts, diagrams, images, or visual elements the student should create for their slides. Be very specific — describe the exact type of visual (e.g., "bar chart comparing Year 1 vs Year 2 projected revenue", "customer journey flowchart with 5 stages", "infographic showing market size breakdown by segment"). For each visual, explain which slide it belongs on and why it strengthens the presentation.

Return JSON in this exact format:
{
  "generalTips": [
    { "tip": "The tip text", "category": "DELIVERY|STRUCTURE|JUDGES|CONFIDENCE|TIMING" }
  ],
  "creativeHooks": [
    { "line": "The clever line or phrase", "context": "When/how to use it in the presentation" }
  ],
  "propIdeas": [
    { "prop": "What the prop is", "howToUse": "How to incorporate it into the presentation" }
  ],
  "graphicIdeas": [
    { "visual": "Description of the graphic/visual", "slide": "Which slide it belongs on", "why": "Why it strengthens the presentation" }
  ]
}

Generate 5-7 general tips, 5-7 creative hooks, 3-5 prop ideas, and 4-6 graphic ideas.

Return ONLY the JSON object, no markdown, no code blocks, no extra text.`,
      messages: [
        {
          role: "user",
          content: `Generate presentation tips, creative hooks, and prop ideas for this DECA project:\n\n${projectContent}`,
        },
      ],
    });
  } catch (err: any) {
    console.error("Anthropic API error (tips):", err.message);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  let result;
  try {
    // Try parsing the whole response first
    result = JSON.parse(rawText);
  } catch {
    try {
      // Try extracting JSON from markdown code blocks
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        result = JSON.parse(codeBlockMatch[1].trim());
      } else {
        // Try extracting any JSON object
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
    } catch {
      console.error("Failed to parse tips JSON. Raw response:", rawText.substring(0, 500));
      result = null;
    }
  }

  if (!result) {
    return NextResponse.json(
      { error: "Failed to generate tips. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
