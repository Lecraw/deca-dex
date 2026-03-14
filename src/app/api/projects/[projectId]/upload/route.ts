import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // File was already uploaded to Supabase Storage by the client.
    // We just receive the metadata here.
    const body = await req.json();
    const { fileName, fileUrl } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "fileName and fileUrl are required" },
        { status: 400 }
      );
    }

    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "pptx"].includes(ext)) {
      return NextResponse.json(
        { error: "Only PDF and PPTX files are supported" },
        { status: 400 }
      );
    }

    // Save file URL and name to project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        uploadedFileName: fileName,
        uploadedFileData: fileUrl, // Now a URL instead of base64
        uploadedFileText: null, // Text extraction not done server-side for URLs
      },
    });

    // Create a placeholder slide record for PDFs
    // PPTX text extraction would require downloading the file, so we skip it
    const parsedSlides: { title: string; content: string }[] = [];

    if (ext === "pdf") {
      parsedSlides.push({
        title: fileName,
        content: "PDF uploaded — view in presentation tab",
      });
    } else if (ext === "pptx") {
      parsedSlides.push({
        title: fileName,
        content: "PPTX uploaded — view in presentation tab",
      });
    }

    if (parsedSlides.length > 0) {
      await prisma.slide.deleteMany({ where: { projectId } });
      await prisma.slide.createMany({
        data: parsedSlides.map((s, i) => ({
          projectId,
          order: i,
          title: s.title,
          contentJson: JSON.stringify({
            blocks: [{ type: "text", content: s.content }],
          }),
        })),
      });
    }

    return NextResponse.json({
      fileName,
      fileUrl,
      slidesCreated: parsedSlides.length,
    });
  } catch (err: any) {
    console.error("Upload handler error:", err?.stack || err);
    return NextResponse.json(
      { error: `Upload error: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      uploadedFileName: null,
      uploadedFileText: null,
      uploadedFileData: null,
    },
  });

  await prisma.slide.deleteMany({ where: { projectId } });

  return NextResponse.json({ success: true });
}
