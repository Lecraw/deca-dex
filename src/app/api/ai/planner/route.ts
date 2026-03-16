import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { plannerSystem } from "@/lib/ai/prompts";
import Anthropic from "@anthropic-ai/sdk";

// DECA 2025-2026 competition dates
const DECA_DATES = {
  icdc: "2026-04-25",
  stateCompetition: "2026-03-01",
  districtCompetition: "2026-01-15",
};

function getNextCompetitionDate(): { date: string; name: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (today < DECA_DATES.districtCompetition) {
    return { date: DECA_DATES.districtCompetition, name: "District Competition" };
  }
  if (today < DECA_DATES.stateCompetition) {
    return { date: DECA_DATES.stateCompetition, name: "State Competition" };
  }
  if (today < DECA_DATES.icdc) {
    return { date: DECA_DATES.icdc, name: "ICDC (Atlanta, GA)" };
  }
  return { date: "2027-04-25", name: "ICDC 2027" };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { date: competitionDate, name: competitionName } = getNextCompetitionDate();
  const today = new Date().toISOString().split("T")[0];
  const daysUntil = Math.ceil(
    (new Date(competitionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const userId = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        let fullText = "";

        const messageStream = client.messages.stream({
          model: "claude-3-haiku-20240307",
          max_tokens: 2048,
          system: plannerSystem(
            projects[0]?.event?.name || "DECA Event",
            competitionDate,
            projectContext
          ),
          messages: [
            {
              role: "user",
              content: `Today is ${today}. My next competition is ${competitionName} on ${competitionDate} (${daysUntil} days away).

Generate a task schedule starting from today (${today}) through the competition date. All task due dates MUST be real calendar dates starting from ${today} and ending at or before ${competitionDate}.

My current projects: ${projectContext}

${daysUntil <= 14
  ? "This is crunch time — focus on final review, practice, and polishing."
  : daysUntil <= 30
  ? "Focus on completing main content, starting practice rounds, and getting feedback."
  : "There's still time — include research, writing, revision, and practice phases."}

Generate tasks for the next ${Math.min(daysUntil, 14)} days only. Make sure every dueDate is a real date starting from ${today}.`,
            },
          ],
        });

        messageStream.on("text", (text) => {
          fullText += text;
          controller.enqueue(encoder.encode(" "));
        });

        await messageStream.finalMessage();

        let tasks;
        try {
          const jsonMatch = fullText.match(/\[[\s\S]*\]/);
          tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          tasks = [];
        }

        const todayDate = new Date(today);
        tasks = tasks.map((task: any) => {
          if (task.dueDate) {
            const taskDate = new Date(task.dueDate);
            if (isNaN(taskDate.getTime()) || taskDate < todayDate) {
              task.dueDate = today;
            }
            if (taskDate > new Date(competitionDate)) {
              task.dueDate = competitionDate;
            }
          }
          return task;
        });

        for (const task of tasks) {
          await prisma.plannerTask.create({
            data: {
              userId,
              title: task.title,
              description: task.description || null,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              priority: task.priority || "MEDIUM",
              aiGenerated: true,
            },
          });
        }

        controller.enqueue(encoder.encode(JSON.stringify({ tasks, count: tasks.length, competitionName, competitionDate, daysUntil })));
        controller.close();
      } catch (err: any) {
        console.error("Planner error:", err.message);
        controller.enqueue(encoder.encode(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache" },
  });
}
