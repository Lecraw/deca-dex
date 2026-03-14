import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for any newly earned badges
  await checkAndAwardBadges(session.user.id);

  // Get all badges with earned status
  const allBadges = await prisma.badge.findMany({
    orderBy: { xpReward: "asc" },
  });

  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    select: { badgeId: true, earnedAt: true },
  });

  const earnedMap = new Map(
    userBadges.map((ub) => [ub.badgeId, ub.earnedAt])
  );

  const badges = allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) || null,
  }));

  return NextResponse.json(badges);
}
