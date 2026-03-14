import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const sections = await prisma.reportSection.findMany({
    where: { project: { id: projectId, userId: session.user.id } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(sections);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.sectionId) {
    const wordCount = (body.bodyHtml || "")
      .replace(/<[^>]*>/g, "")
      .split(/\s+/)
      .filter(Boolean).length;

    const section = await prisma.reportSection.update({
      where: { id: body.sectionId },
      data: {
        title: body.title,
        bodyHtml: body.bodyHtml,
        wordCount,
      },
    });
    return NextResponse.json(section);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
