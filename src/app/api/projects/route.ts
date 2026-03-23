import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionOrToken } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { RESEARCH_TEMPLATES } from "@/lib/research-templates";

export async function GET(req: NextRequest) {
  const session = await getSessionOrToken(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        select: { code: true, name: true, eventType: true },
      },
      _count: { select: { slides: true, sections: true, research: true, feedback: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, eventId, businessIdea, ideaJson } = body;

  if (!title || !eventId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.decaEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      title,
      eventId,
      userId: session.user.id,
      businessIdea,
      ideaJson: ideaJson ? JSON.stringify(ideaJson) : null,
      status: "DRAFT",
    },
    include: {
      event: { select: { code: true, name: true, eventType: true, sectionsJson: true } },
    },
  });

  // Auto-create sections based on event type
  const sections = JSON.parse(event.sectionsJson) as any[];
  if (sections.length > 0 && event.eventType === "WRITTEN_REPORT") {
    await prisma.reportSection.createMany({
      data: sections.map((s: any, i: number) => ({
        projectId: project.id,
        order: i,
        title: s.title,
        bodyHtml: "",
        sectionType: s.key || s.title.toLowerCase().replace(/\s+/g, "_"),
      })),
    });
  }

  // Auto-create research documents for all project types
  await prisma.researchDocument.createMany({
    data: RESEARCH_TEMPLATES.map((t, i) => ({
      projectId: project.id,
      order: i,
      title: t.title,
      template: t.key,
      contentJson: "{}",
      status: "NOT_STARTED",
    })),
  });

  // Award XP for creating project
  await awardXp(session.user.id, "CREATE_PROJECT", { projectId: project.id });
  await checkAndAwardBadges(session.user.id);

  return NextResponse.json(project, { status: 201 });
}
