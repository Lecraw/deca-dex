import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp, type XpAction } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, metadata } = await req.json();

  if (!action) {
    return NextResponse.json({ error: "Action required" }, { status: 400 });
  }

  const result = await awardXp(session.user.id, action as XpAction, metadata);

  // Check for new badges after XP award
  const newBadges = await checkAndAwardBadges(session.user.id);

  return NextResponse.json({
    ...result,
    newBadges,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true },
  });

  const recentLogs = await prisma.xpLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ ...user, recentLogs });
}
