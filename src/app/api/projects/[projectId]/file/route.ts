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

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { uploadedFileData: true, uploadedFileName: true },
  });

  if (!project?.uploadedFileData) {
    return NextResponse.json({ error: "No file data" }, { status: 404 });
  }

  return NextResponse.json({
    fileData: project.uploadedFileData,
    fileName: project.uploadedFileName,
  });
}
