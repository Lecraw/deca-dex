import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const format = req.nextUrl.searchParams.get("format") || "pdf";

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      event: true,
      slides: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    if (format === "pptx") {
      return await exportPptx(project);
    } else if (format === "docx") {
      return await exportDocx(project);
    } else {
      return NextResponse.json(
        { error: "PDF export is handled client-side" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

async function exportPptx(project: any) {
  const pptx = new PptxGenJS();
  pptx.title = project.title;
  pptx.subject = project.event?.name || "DECA Project";
  pptx.author = "DUZZ";

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(project.title, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: "1a1a2e",
    align: "center",
  });
  titleSlide.addText(project.event?.name || "", {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.8,
    fontSize: 18,
    color: "666666",
    align: "center",
  });
  if (project.businessIdea) {
    titleSlide.addText(project.businessIdea, {
      x: 1,
      y: 4.2,
      w: 8,
      h: 1,
      fontSize: 14,
      color: "888888",
      align: "center",
      italic: true,
    });
  }

  // Content slides
  for (const slide of project.slides) {
    const pptxSlide = pptx.addSlide();

    pptxSlide.addText(slide.title || `Slide ${slide.order}`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: "1a1a2e",
    });

    // Parse content from contentJson
    let content = "";
    if (slide.contentJson) {
      try {
        const blocks =
          typeof slide.contentJson === "string"
            ? JSON.parse(slide.contentJson)
            : slide.contentJson;
        if (Array.isArray(blocks)) {
          content = blocks
            .map((b: any) => b.text || b.content || "")
            .filter(Boolean)
            .join("\n\n");
        } else if (typeof blocks === "object" && blocks.text) {
          content = blocks.text;
        }
      } catch {
        content = String(slide.contentJson);
      }
    }

    if (content) {
      pptxSlide.addText(content, {
        x: 0.5,
        y: 1.3,
        w: 9,
        h: 4,
        fontSize: 16,
        color: "333333",
        valign: "top",
        wrap: true,
      });
    }

    // Add speaker notes
    if (slide.notesText) {
      pptxSlide.addNotes(slide.notesText);
    }
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}.pptx"`,
    },
  });
}

async function exportDocx(project: any) {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: project.title, bold: true, size: 52 })],
    })
  );

  // Event info
  if (project.event?.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.event.name,
            color: "666666",
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Business idea
  if (project.businessIdea) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.businessIdea,
            italics: true,
            color: "888888",
            size: 22,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Sections
  for (const section of project.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: section.title || `Section ${section.order}`,
            bold: true,
            size: 32,
          }),
        ],
        spacing: { before: 400 },
      })
    );

    // Parse HTML content into plain text
    const bodyText = section.bodyHtml
      ? section.bodyHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim()
      : "";

    if (bodyText) {
      const paragraphs = bodyText.split("\n\n").filter(Boolean);
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para.trim(), size: 22 })],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx"`,
    },
  });
}
