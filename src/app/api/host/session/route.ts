import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, readHost } from "@/lib/live-session";
import { generateScenario } from "@/lib/ai/live-roleplay";

export async function GET() {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.liveSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      code: s.code,
      eventCode: s.eventCode,
      status: s.status,
      createdAt: s.createdAt,
      closedAt: s.closedAt,
      participantCount: s._count.participants,
    }))
  );
}

export async function POST(req: NextRequest) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const eventCode = typeof body.eventCode === "string" ? body.eventCode : "";
  if (!eventCode) {
    return NextResponse.json({ error: "eventCode required" }, { status: 400 });
  }

  const event = await prisma.decaEvent.findUnique({ where: { code: eventCode } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.eventType !== "ROLEPLAY") {
    return NextResponse.json(
      { error: "Only roleplay events can be used for live sessions." },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const scenarioData = await generateScenario(event, { controller, encoder });
        if (!scenarioData) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: "Failed to generate scenario. Please try again." })
            )
          );
          controller.close();
          return;
        }

        // Create the session with a unique code, retry on collision
        let created: { id: string; code: string } | null = null;
        let lastErr: unknown = null;
        for (let i = 0; i < 5; i++) {
          const code = generateCode();
          try {
            const s = await prisma.liveSession.create({
              data: {
                code,
                eventCode,
                scenarioJson: JSON.stringify(scenarioData),
                status: "open",
              },
              select: { id: true, code: true },
            });
            created = s;
            break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (!created) {
          console.error("Failed to create session after 5 retries", lastErr);
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: "Could not generate a unique join code. Please try again." }))
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(JSON.stringify({ sessionId: created.id, code: created.code }))
        );
        controller.close();
      } catch (err) {
        console.error("Host create-session error:", (err as Error).message);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Failed to create session. Please try again." }))
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
