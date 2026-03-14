"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Presentation, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<Record<string, "success" | "error">>({});

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  const isPitchDeck = project?.event?.eventType === "PITCH_DECK";

  const handleExport = async (format: string) => {
    setExporting(format);
    setExportStatus((prev) => {
      const next = { ...prev };
      delete next[format];
      return next;
    });

    try {
      const res = await fetch(`/api/projects/${projectId}/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format;
      a.download = `${project?.title || "project"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus((prev) => ({ ...prev, [format]: "success" }));
    } catch {
      setExportStatus((prev) => ({ ...prev, [format]: "error" }));
    } finally {
      setExporting(null);
    }
  };

  const slideCount = project?.slides?.length || 0;
  const sectionCount = project?.sections?.length || 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Export Project</h1>
          <p className="text-muted-foreground text-sm">
            Download your project in various formats
          </p>
        </div>
      </div>

      {/* Project summary */}
      {project && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="text-sm text-muted-foreground">
                  {project.event?.name}
                </p>
              </div>
              <div className="flex gap-2">
                {isPitchDeck && (
                  <Badge variant="secondary">{slideCount} slides</Badge>
                )}
                {!isPitchDeck && (
                  <Badge variant="secondary">{sectionCount} sections</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPitchDeck && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">PowerPoint</CardTitle>
              </div>
              <CardDescription>
                Download as .pptx file. Edit in PowerPoint or Google Slides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleExport("pptx")}
                disabled={exporting !== null}
              >
                {exporting === "pptx" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : exportStatus.pptx === "success" ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : exportStatus.pptx === "error" ? (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exporting === "pptx"
                  ? "Exporting..."
                  : exportStatus.pptx === "success"
                    ? "Downloaded!"
                    : exportStatus.pptx === "error"
                      ? "Export Failed - Retry"
                      : "Export PPTX"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPitchDeck && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Word Document</CardTitle>
              </div>
              <CardDescription>
                Download as .docx file. Edit in Word or Google Docs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleExport("docx")}
                disabled={exporting !== null}
              >
                {exporting === "docx" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : exportStatus.docx === "success" ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : exportStatus.docx === "error" ? (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exporting === "docx"
                  ? "Exporting..."
                  : exportStatus.docx === "success"
                    ? "Downloaded!"
                    : exportStatus.docx === "error"
                      ? "Export Failed - Retry"
                      : "Export DOCX"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <strong>Tip:</strong> Run the compliance checker before exporting to
            ensure your project meets all DECA requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
