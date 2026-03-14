import "dotenv/config";
import path from "path";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { decaEvents } from "./events";
import { badges } from "./badges";

const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding DECA events...");

  for (const event of decaEvents) {
    await prisma.decaEvent.upsert({
      where: { code: event.code },
      update: {
        name: event.name,
        cluster: event.cluster,
        category: event.category,
        eventType: event.eventType,
        maxSlides: event.maxSlides,
        maxPages: event.maxPages,
        presentationMin: event.presentationMin,
        prepMin: event.prepMin,
        hasExam: event.hasExam,
        teamMin: event.teamMin,
        teamMax: event.teamMax,
        description: event.description,
        rubricJson: JSON.stringify(event.rubricJson),
        guidelinesJson: JSON.stringify(event.guidelinesJson),
        sectionsJson: JSON.stringify(event.sectionsJson),
      },
      create: {
        code: event.code,
        name: event.name,
        cluster: event.cluster,
        category: event.category,
        eventType: event.eventType,
        maxSlides: event.maxSlides,
        maxPages: event.maxPages,
        presentationMin: event.presentationMin,
        prepMin: event.prepMin,
        hasExam: event.hasExam,
        teamMin: event.teamMin,
        teamMax: event.teamMax,
        description: event.description,
        rubricJson: JSON.stringify(event.rubricJson),
        guidelinesJson: JSON.stringify(event.guidelinesJson),
        sectionsJson: JSON.stringify(event.sectionsJson),
      },
    });
  }

  console.log(`Seeded ${decaEvents.length} DECA events`);

  // Clean up old events that are no longer in the seed data
  const validCodes = decaEvents.map((e) => e.code);
  const oldEvents = await prisma.decaEvent.findMany({
    where: { code: { notIn: validCodes } },
    select: { id: true, code: true },
  });
  if (oldEvents.length > 0) {
    const oldEventIds = oldEvents.map((e) => e.id);
    // Delete related records first
    await prisma.project.deleteMany({ where: { eventId: { in: oldEventIds } } });
    await prisma.decaEvent.deleteMany({ where: { id: { in: oldEventIds } } });
    console.log(`Cleaned up ${oldEvents.length} old events: ${oldEvents.map((e) => e.code).join(", ")}`);
  }

  console.log("Seeding badges...");

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        xpReward: badge.xpReward,
        condition: JSON.stringify(badge.condition),
      },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        xpReward: badge.xpReward,
        condition: JSON.stringify(badge.condition),
      },
    });
  }

  console.log(`Seeded ${badges.length} badges`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
