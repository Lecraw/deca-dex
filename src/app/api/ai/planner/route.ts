import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { plannerSystem } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's projects for context
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { name: true } },
      _count: { select: { slides: true, sections: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

  const projectContext = projects.length > 0
    ? projects.map((p) => `${p.title} (${p.event.name}) - ${p.status}`).join(", ")
    : "No active projects";

  const competitionDate = new Date();
  competitionDate.setDate(competitionDate.getDate() + 30);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: plannerSystem(
      projects[0]?.event?.name || "DECA Event",
      competitionDate.toISOString().split("T")[0],
      projectContext
    ),
    messages: [
      {
        role: "user",
        content: `Generate a daily task schedule for the next 2 weeks to help me prepare for DECA. My current projects: ${projectContext}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let tasks;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    tasks = [];
  }

  // Save tasks to database
  for (const task of tasks) {
    await prisma.plannerTask.create({
      data: {
        userId: session.user.id,
        title: task.title,
        description: task.description || null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: task.priority || "MEDIUM",
        aiGenerated: true,
      },
    });
  }

  return NextResponse.json({ tasks, count: tasks.length });
}
