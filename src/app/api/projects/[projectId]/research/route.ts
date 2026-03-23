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

  const docs = await prisma.researchDocument.findMany({
    where: { project: { id: projectId, userId: session.user.id } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    docs.map((d) => ({
      ...d,
      contentJson:
        typeof d.contentJson === "string"
          ? JSON.parse(d.contentJson)
          : d.contentJson,
    }))
  );
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
  const { title, template } = body;

  if (!title || !template) {
    return NextResponse.json(
      { error: "Missing title or template" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const maxOrder = await prisma.researchDocument.aggregate({
    where: { projectId },
    _max: { order: true },
  });

  const doc = await prisma.researchDocument.create({
    data: {
      projectId,
      order: (maxOrder._max.order ?? -1) + 1,
      title,
      template,
      contentJson: "{}",
      status: "NOT_STARTED",
    },
  });

  return NextResponse.json(doc, { status: 201 });
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
  const { researchId, contentJson, status } = body;

  if (!researchId) {
    return NextResponse.json(
      { error: "Missing researchId" },
      { status: 400 }
    );
  }

  const doc = await prisma.researchDocument.update({
    where: { id: researchId },
    data: {
      ...(contentJson !== undefined
        ? {
            contentJson:
              typeof contentJson === "string"
                ? contentJson
                : JSON.stringify(contentJson),
          }
        : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

  return NextResponse.json(doc);
}
