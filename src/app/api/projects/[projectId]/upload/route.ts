import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allow longer execution for large uploads
export const maxDuration = 60;

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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 50 MB." },
      { status: 400 }
    );
  }

  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (!ext || !["pdf", "pptx"].includes(ext)) {
    return NextResponse.json(
      { error: "Only PDF and PPTX files are supported" },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 400 }
    );
  }
  let extractedText = "";
  let slideCount = 0;

  try {
    if (ext === "pdf") {
      try {
        const { extractText } = await import("unpdf");
        const uint8 = new Uint8Array(buffer);
        const { text: pageTexts, totalPages } = await extractText(uint8, { mergePages: false });
        slideCount = totalPages;
        extractedText = pageTexts.join("\f");
      } catch (pdfErr: any) {
        // unpdf may fail in some serverless environments — still accept the file
        console.warn("PDF text extraction failed:", pdfErr.message);
        slideCount = 1;
      }
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

  // Store file as base64 for client-side rendering
  const fileBase64 = buffer.toString("base64");
  const mimeType = ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const dataUrl = `data:${mimeType};base64,${fileBase64}`;

  // Save extracted text and file data to project
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        uploadedFileName: fileName,
        uploadedFileText: extractedText.trim() || null,
        uploadedFileData: dataUrl,
      },
    });
  } catch (dbErr: any) {
    console.error("DB save error:", dbErr.message);
    // If file data is too large for DB, save without it
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          uploadedFileName: fileName,
          uploadedFileText: extractedText.trim() || null,
          uploadedFileData: null,
        },
      });
    } catch (dbErr2: any) {
      console.error("DB save error (retry):", dbErr2.message);
      return NextResponse.json(
        { error: `Failed to save file: ${dbErr2.message}` },
        { status: 500 }
      );
    }
  }

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
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
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
