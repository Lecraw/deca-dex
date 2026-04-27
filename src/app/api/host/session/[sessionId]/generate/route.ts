import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readHost } from "@/lib/live-session";
import { generateScenario } from "@/lib/ai/live-roleplay";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function POST(_req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  // Idempotent: if scenario already exists, just return current status.
  if (session.status !== "generating") {
    return NextResponse.json({ status: session.status });
  }

  const event = await prisma.decaEvent.findUnique({
    where: { code: session.eventCode },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const sink = {
    controller: {
      enqueue: () => {},
      close: () => {},
      error: () => {},
    } as unknown as ReadableStreamDefaultController<Uint8Array>,
    encoder: new TextEncoder(),
  };

  try {
    const scenarioData = await generateScenario(event, sink);
    if (!scenarioData) {
      await prisma.liveSession.update({
        where: { id: sessionId },
        data: { status: "scenario_failed" },
      });
      return NextResponse.json({ status: "scenario_failed" });
    }
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        scenarioJson: JSON.stringify(scenarioData),
        status: "open",
      },
    });
    return NextResponse.json({ status: "open" });
  } catch (err) {
    console.error("Scenario generation failed:", err);
    await prisma.liveSession
      .update({
        where: { id: sessionId },
        data: { status: "scenario_failed" },
      })
      .catch(() => {});
    const message = (err as Error).message || "unknown error";
    return NextResponse.json(
      { error: `Scenario generation failed: ${message}` },
      { status: 500 }
    );
  }
}
