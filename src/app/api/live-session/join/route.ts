import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractIp,
  rateLimit,
  setParticipantCookie,
} from "@/lib/live-session";

function cleanDisplayName(raw: string): string {
  return raw
    // strip control chars (NUL through 0x1F, plus DEL)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

function isValidEmail(email: string): boolean {
  // Simple but reasonable email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

export async function POST(req: NextRequest) {
  const ip = extractIp(req);
  const allowed = await rateLimit(`join:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: { email?: string; displayName?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = cleanDisplayName(
    typeof body.displayName === "string" ? body.displayName : ""
  );
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "Display name required." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Game code must be 6 digits." }, { status: 400 });
  }

  const session = await prisma.liveSession.findUnique({ where: { code } });
  if (!session) {
    return NextResponse.json({ error: "Game code not found." }, { status: 404 });
  }
  if (session.status !== "open") {
    return NextResponse.json({ error: "This session is closed." }, { status: 409 });
  }

  // Resume if this email already joined this session
  const existing = await prisma.liveParticipant.findUnique({
    where: { sessionId_email: { sessionId: session.id, email } },
  });

  let participantId: string;
  if (existing) {
    // Update their display name if they changed it
    if (existing.displayName !== displayName) {
      await prisma.liveParticipant.update({
        where: { id: existing.id },
        data: { displayName },
      });
    }
    participantId = existing.id;
  } else {
    const created = await prisma.liveParticipant.create({
      data: {
        sessionId: session.id,
        email,
        displayName,
      },
      select: { id: true },
    });
    participantId = created.id;
  }

  const res = NextResponse.json({
    participantId,
    sessionId: session.id,
    resumed: !!existing,
    completed: !!existing?.completed,
  });
  setParticipantCookie(res, participantId, session.id);
  return res;
}
