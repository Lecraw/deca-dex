import { prisma } from "@/lib/prisma";
import { XP_VALUES, getLevelForXp } from "./constants";

export type XpAction = keyof typeof XP_VALUES;

export async function awardXp(userId: string, action: XpAction, metadata?: Record<string, any>) {
  const xpAmount = XP_VALUES[action];
  if (!xpAmount) return null;

  // Update user XP and recalculate level
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpAmount },
    },
  });

  const newLevel = getLevelForXp(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  // Log the XP event
  await prisma.xpLog.create({
    data: {
      userId,
      amount: xpAmount,
      reason: action,
      metadata: JSON.stringify(metadata || {}),
    },
  });

  return { xp: xpAmount, totalXp: user.xp, level: newLevel };
}
