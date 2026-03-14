import { prisma } from "@/lib/prisma";

interface BadgeCondition {
  code: string;
  check: (userId: string) => Promise<boolean>;
}

const badgeConditions: BadgeCondition[] = [
  {
    code: "first_idea",
    check: async (userId) => {
      const count = await prisma.project.count({
        where: { userId, businessIdea: { not: null } },
      });
      return count >= 1;
    },
  },
  {
    code: "idea_machine",
    check: async (userId) => {
      const count = await prisma.project.count({
        where: { userId, businessIdea: { not: null } },
      });
      return count >= 5;
    },
  },
  {
    code: "project_starter",
    check: async (userId) => {
      const count = await prisma.project.count({ where: { userId } });
      return count >= 1;
    },
  },
  {
    code: "multi_project",
    check: async (userId) => {
      const count = await prisma.project.count({ where: { userId } });
      return count >= 3;
    },
  },
  {
    code: "pitch_master",
    check: async (userId) => {
      const count = await prisma.project.count({
        where: {
          userId,
          event: { eventType: "PITCH_DECK" },
          slides: { some: {} },
        },
      });
      return count >= 1;
    },
  },
  {
    code: "report_writer",
    check: async (userId) => {
      const count = await prisma.project.count({
        where: {
          userId,
          event: { eventType: "WRITTEN_REPORT" },
          sections: { some: { bodyHtml: { not: "" } } },
        },
      });
      return count >= 1;
    },
  },
  {
    code: "judge_approved",
    check: async (userId) => {
      const score = await prisma.judgeScore.findFirst({
        where: { project: { userId }, totalScore: { gte: 80 } },
      });
      return !!score;
    },
  },
  {
    code: "compliance_perfect",
    check: async (userId) => {
      const projects = await prisma.project.findMany({
        where: { userId },
        select: { complianceJson: true },
      });
      const project = projects.find((p) => p.complianceJson !== null);
      if (!project?.complianceJson) return false;
      try {
        const compliance =
          typeof project.complianceJson === "string"
            ? JSON.parse(project.complianceJson)
            : project.complianceJson;
        return compliance.score === 100;
      } catch {
        return false;
      }
    },
  },
  {
    code: "feedback_seeker",
    check: async (userId) => {
      const count = await prisma.aiFeedback.count({
        where: { project: { userId } },
      });
      return count >= 5;
    },
  },
  {
    code: "roleplay_ready",
    check: async (userId) => {
      const count = await prisma.roleplaySession.count({
        where: { userId },
      });
      return count >= 1;
    },
  },
];

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const newBadges: string[] = [];

  // Get all existing badges for user
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badge: { select: { code: true } } },
  });
  const earnedCodes = new Set(existingBadges.map((ub) => ub.badge.code));

  for (const condition of badgeConditions) {
    if (earnedCodes.has(condition.code)) continue;

    try {
      const earned = await condition.check(userId);
      if (!earned) continue;

      // Find badge by code
      const badge = await prisma.badge.findUnique({
        where: { code: condition.code },
      });
      if (!badge) continue;

      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      newBadges.push(condition.code);
    } catch {
      // Skip badge if check fails
    }
  }

  return newBadges;
}
