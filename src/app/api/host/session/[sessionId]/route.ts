import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readHost } from "@/lib/live-session";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let scenario: {
    eventName?: string;
    scenario?: string;
    performanceIndicators?: string[];
    roleplayStartedAt?: string | null;
  } = {};
  try {
    scenario = JSON.parse(session.scenarioJson);
  } catch {
    // corrupted scenarioJson — keep going with empty fallback
  }

  return NextResponse.json({
    id: session.id,
    code: session.code,
    eventCode: session.eventCode,
    status: session.status,
    createdAt: session.createdAt,
    closedAt: session.closedAt,
    eventName: scenario.eventName ?? session.eventCode,
    scenario: scenario.scenario ?? "",
    performanceIndicators: scenario.performanceIndicators ?? [],
    roleplayStartedAt: scenario.roleplayStartedAt ?? null,
    participants: session.participants.map((p) => ({
      id: p.id,
      email: p.email,
      displayName: p.displayName,
      completed: p.completed,
      totalScore: p.totalScore,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    })),
  });
}

export async function POST(req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action !== "start_roleplay") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (existing.status !== "open") {
    return NextResponse.json(
      { error: "Session is not open." },
      { status: 409 }
    );
  }

  let scenario: Record<string, unknown> = {};
  try {
    scenario = JSON.parse(existing.scenarioJson);
  } catch {
    return NextResponse.json(
      { error: "Scenario data is corrupted." },
      { status: 500 }
    );
  }

  if (scenario.roleplayStartedAt) {
    return NextResponse.json({ roleplayStartedAt: scenario.roleplayStartedAt });
  }

  const startedAt = new Date().toISOString();
  scenario.roleplayStartedAt = startedAt;

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { scenarioJson: JSON.stringify(scenario) },
  });

  return NextResponse.json({ roleplayStartedAt: startedAt });
}

export async function DELETE(_req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  const existing = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { status: "closed", closedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
