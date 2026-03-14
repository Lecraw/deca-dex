import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getXpForNextLevel } from "@/lib/gamification/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          projects: true,
          roleplaySessions: true,
          plannerTasks: true,
        },
      },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const levelProgress = getXpForNextLevel(user.xp);

  // Get recent projects
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { code: true, name: true, eventType: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Get completed tasks count
  const completedTasks = await prisma.plannerTask.count({
    where: { userId: session.user.id, completed: true },
  });

  return NextResponse.json({
    ...user,
    levelProgress,
    recentProjects: projects,
    completedTasks,
  });
}
