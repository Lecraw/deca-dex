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

  const slides = await prisma.slide.findMany({
    where: { project: { id: projectId, userId: session.user.id } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(slides);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = await req.json();

  const maxOrder = await prisma.slide.aggregate({
    where: { projectId },
    _max: { order: true },
  });

  const slide = await prisma.slide.create({
    data: {
      projectId,
      order: (maxOrder._max.order ?? -1) + 1,
      title: body.title || "New Slide",
      contentJson: JSON.stringify(body.contentJson || { blocks: [{ type: "text", content: "" }] }),
      notesText: body.notesText,
    },
  });

  return NextResponse.json(slide, { status: 201 });
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

  if (body.slideId) {
    const slide = await prisma.slide.update({
      where: { id: body.slideId },
      data: {
        title: body.title,
        contentJson: body.contentJson ? JSON.stringify(body.contentJson) : undefined,
        notesText: body.notesText,
      },
    });
    return NextResponse.json(slide);
  }

  // Reorder slides — use negative temp values to avoid unique constraint on (projectId, order)
  if (body.reorder && Array.isArray(body.reorder)) {
    // First pass: set all to negative temp values
    for (let i = 0; i < body.reorder.length; i++) {
      await prisma.slide.update({
        where: { id: body.reorder[i] },
        data: { order: -(i + 1) },
      });
    }
    // Second pass: set to final positive values
    for (let i = 0; i < body.reorder.length; i++) {
      await prisma.slide.update({
        where: { id: body.reorder[i] },
        data: { order: i },
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
