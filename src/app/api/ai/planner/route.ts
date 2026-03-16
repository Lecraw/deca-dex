import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { plannerSystem } from "@/lib/ai/prompts";

// DECA 2025-2026 competition dates
const DECA_DATES = {
  // ICDC 2026: April 25-28, 2026 in Atlanta, GA
  icdc: "2026-04-25",
  // State competitions typically happen in February-March
  // Districts typically happen in January-February
  stateCompetition: "2026-03-01", // approximate — varies by state
  districtCompetition: "2026-01-15", // approximate — varies by state
};

function getNextCompetitionDate(): { date: string; name: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Return the next upcoming competition date
  if (today < DECA_DATES.districtCompetition) {
    return { date: DECA_DATES.districtCompetition, name: "District Competition" };
  }
  if (today < DECA_DATES.stateCompetition) {
    return { date: DECA_DATES.stateCompetition, name: "State Competition" };
  }
  if (today < DECA_DATES.icdc) {
    return { date: DECA_DATES.icdc, name: "ICDC (Atlanta, GA)" };
  }
  // Past all dates — default to next year's ICDC (placeholder)
  return { date: "2027-04-25", name: "ICDC 2027" };
}

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

  const { date: competitionDate, name: competitionName } = getNextCompetitionDate();
  const today = new Date().toISOString().split("T")[0];

  // Calculate days until competition
  const daysUntil = Math.ceil(
    (new Date(competitionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
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
  } catch (err: any) {
    console.error("Anthropic API error (planner):", err.message);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let tasks;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    tasks = [];
  }

  // Validate and fix dates — ensure all dates are real and not in the past
  const todayDate = new Date(today);
  tasks = tasks.map((task: any) => {
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate);
      // If the date is invalid or in the past, set it to today
      if (isNaN(taskDate.getTime()) || taskDate < todayDate) {
        task.dueDate = today;
      }
      // If the date is after competition, set it to competition date
      if (taskDate > new Date(competitionDate)) {
        task.dueDate = competitionDate;
      }
    }
    return task;
  });

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

  return NextResponse.json({ tasks, count: tasks.length, competitionName, competitionDate, daysUntil });
}
