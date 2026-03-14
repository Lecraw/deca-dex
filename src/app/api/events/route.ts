import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const event = await prisma.decaEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...event,
      rubricJson: JSON.parse(event.rubricJson),
      guidelinesJson: JSON.parse(event.guidelinesJson),
      sectionsJson: JSON.parse(event.sectionsJson),
    });
  }

  const events = await prisma.decaEvent.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      cluster: true,
      category: true,
      eventType: true,
      teamMin: true,
      teamMax: true,
      presentationMin: true,
      prepMin: true,
      hasExam: true,
      description: true,
    },
  });

  return NextResponse.json(events);
}
