import { NextRequest, NextResponse } from "next/server";
import { getSessionOrToken } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";

function safeJsonParse(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getSessionOrToken(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      event: true,
      slides: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
      research: { orderBy: { order: "asc" } },
      feedback: { orderBy: { createdAt: "desc" }, take: 20 },
      scores: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse JSON string fields for client consumption
  // Exclude uploadedFileData (large base64) from default response
  const { uploadedFileData: _fileData, ...projectWithoutFile } = project;
  return NextResponse.json({
    ...projectWithoutFile,
    hasUploadedFile: !!_fileData,
    ideaJson: safeJsonParse(project.ideaJson),
    complianceJson: safeJsonParse(project.complianceJson),
    slides: project.slides.map((s) => ({
      ...s,
      contentJson: safeJsonParse(s.contentJson),
    })),
    research: project.research.map((r) => ({
      ...r,
      contentJson: safeJsonParse(r.contentJson),
    })),
    scores: project.scores.map((s) => ({
      ...s,
      categoriesJson: safeJsonParse(s.categoriesJson),
      strengths: safeJsonParse(s.strengths),
      improvements: safeJsonParse(s.improvements),
    })),
    event: {
      ...project.event,
      rubricJson: safeJsonParse(project.event.rubricJson),
      guidelinesJson: safeJsonParse(project.event.guidelinesJson),
      sectionsJson: safeJsonParse(project.event.sectionsJson),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getSessionOrToken(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = await req.json();

  // Stringify JSON fields if present
  const data: any = { ...body };
  if (data.ideaJson && typeof data.ideaJson !== "string") {
    data.ideaJson = JSON.stringify(data.ideaJson);
  }
  if (data.complianceJson && typeof data.complianceJson !== "string") {
    data.complianceJson = JSON.stringify(data.complianceJson);
  }

  const project = await prisma.project.updateMany({
    where: { id: projectId, userId: session.user.id },
    data,
  });

  return NextResponse.json(project);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getSessionOrToken(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
