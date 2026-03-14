import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (!ext || !["pdf", "pptx"].includes(ext)) {
    return NextResponse.json(
      { error: "Only PDF and PPTX files are supported" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";
  let slideCount = 0;

  try {
    if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
      slideCount = pdfData.numpages || 1;
    } else if (ext === "pptx") {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
          return numA - numB;
        });

      slideCount = slideFiles.length;

      for (const slideFile of slideFiles) {
        const slideXml = await zip.files[slideFile].async("string");
        const textMatches =
          slideXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
        const slideTexts = textMatches
          .map((m) => m.replace(/<[^>]+>/g, ""))
          .filter(Boolean);
        const slideNum = slideFile.match(/slide(\d+)/)?.[1] || "?";
        if (slideTexts.length > 0) {
          extractedText += `\n--- Slide ${slideNum} ---\n${slideTexts.join("\n")}\n`;
        }
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to parse file: ${err.message}` },
      { status: 400 }
    );
  }

  // Save extracted text to project
  await prisma.project.update({
    where: { id: projectId },
    data: {
      uploadedFileName: fileName,
      uploadedFileText: extractedText.trim() || null,
    },
  });

  // Create slide records — one per page/slide
  const parsedSlides: { title: string; content: string }[] = [];

  if (ext === "pptx") {
    const slideBlocks = extractedText
      .split(/\n--- Slide \d+ ---\n/)
      .filter(Boolean);
    const count = Math.max(slideCount, slideBlocks.length);
    for (let i = 0; i < count; i++) {
      const block = slideBlocks[i] || "";
      const lines = block.trim().split("\n").filter(Boolean);
      parsedSlides.push({
        title: lines[0]?.slice(0, 80) || `Slide ${i + 1}`,
        content: lines.join("\n"),
      });
    }
  } else if (ext === "pdf") {
    const textByPage = extractedText.includes("\f")
      ? extractedText.split("\f")
      : [extractedText];

    for (let i = 0; i < slideCount; i++) {
      const pageText = (textByPage[i] || "").trim();
      const lines = pageText.split("\n").filter(Boolean);
      parsedSlides.push({
        title: lines[0]?.slice(0, 80) || `Page ${i + 1}`,
        content: pageText,
      });
    }
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
    textLength: (extractedText.trim() || "").length,
    slidesCreated: parsedSlides.length,
  });
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
    },
  });

  await prisma.slide.deleteMany({ where: { projectId } });

  return NextResponse.json({ success: true });
}
