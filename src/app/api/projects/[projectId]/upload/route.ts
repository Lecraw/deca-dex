import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { execSync } from "child_process";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

/** Try to convert PPTX to PDF using LibreOffice. Returns true on success. */
function convertPptxToPdf(pptxPath: string, outputDir: string): boolean {
  try {
    // Try soffice first (macOS Homebrew), then libreoffice
    const cmds = ["soffice", "libreoffice"];
    for (const cmd of cmds) {
      try {
        execSync(
          `${cmd} --headless --convert-to pdf --outdir "${outputDir}" "${pptxPath}"`,
          { timeout: 30000, stdio: "pipe" }
        );
        return true;
      } catch {
        continue;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/** Count pages in a PDF using pdf-parse */
async function countPdfPages(buffer: Buffer): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.numpages || 1;
  } catch {
    return 1;
  }
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
  let pdfBuffer: Buffer | null = null;
  let slideCount = 0;

  await ensureUploadsDir();

  try {
    if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
      pdfBuffer = buffer;
      slideCount = pdfData.numpages || 1;
    } else if (ext === "pptx") {
      // Extract text from PPTX by parsing XML
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

      // Save PPTX to disk and try converting to PDF
      const pptxPath = path.join(UPLOADS_DIR, `${projectId}.pptx`);
      await fs.writeFile(pptxPath, buffer);

      const converted = convertPptxToPdf(pptxPath, UPLOADS_DIR);
      if (converted) {
        // LibreOffice outputs {projectId}.pdf in the same directory
        const convertedPdfPath = path.join(UPLOADS_DIR, `${projectId}.pdf`);
        try {
          pdfBuffer = await fs.readFile(convertedPdfPath);
          // Get actual page count from the PDF
          slideCount = await countPdfPages(pdfBuffer);
        } catch {
          pdfBuffer = null;
        }
      }

      // Clean up PPTX file (we only need the PDF)
      try {
        await fs.unlink(pptxPath);
      } catch {
        // ignore
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to parse file: ${err.message}` },
      { status: 400 }
    );
  }

  // Save PDF to disk for serving
  const hasPdf = !!pdfBuffer;
  if (pdfBuffer) {
    const pdfPath = path.join(UPLOADS_DIR, `${projectId}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);
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
    // Use max of slideCount (from XML) and text blocks
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
    // One slide per PDF page
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
    hasPdf,
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

  // Delete PDF file from disk
  try {
    await fs.unlink(path.join(UPLOADS_DIR, `${projectId}.pdf`));
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true });
}
