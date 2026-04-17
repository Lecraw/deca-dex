import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readParticipant } from "@/lib/live-session";

export async function GET() {
  const auth = await readParticipant();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participants = await prisma.liveParticipant.findMany({
    where: { sessionId: auth.sessionId, completed: true },
    orderBy: [{ totalScore: "desc" }, { completedAt: "asc" }],
    select: {
      id: true,
      displayName: true,
      totalScore: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    meId: auth.participantId,
    participants: participants.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      displayName: p.displayName,
      totalScore: p.totalScore ?? 0,
      isMe: p.id === auth.participantId,
    })),
  });
}
