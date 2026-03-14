"use client";

import { useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import dynamic from "next/dynamic";
import { uploadDeckFile } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Sparkles,
  BarChart3,
  CheckCircle,
  FileUp,
  Presentation,
} from "lucide-react";

const PdfSlidePreview = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfSlidePreview),
  { ssr: false }
);
const PdfSlideMain = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfSlideMain),
  { ssr: false }
);

export default function PresentationPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  // Fetch the PDF file data separately (large payload)
  const { data: fileData, isLoading: fileLoading } = useQuery({
    queryKey: ["project-file", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/file`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!project?.hasUploadedFile,
    staleTime: 5 * 60 * 1000,
  });

  const fileDataUrl = fileData?.fileData || null;
  const fileName = fileData?.fileName || project?.uploadedFileName || "";
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const pdfDataUrl = isPdf ? fileDataUrl : null;
  const memoizedPdfFile = useMemo(
    () => (pdfDataUrl ? { url: pdfDataUrl } : null),
    [pdfDataUrl]
  );

  // For PDFs, use the actual page count from react-pdf; for PPTX use slides
  const totalPages = isPdf ? pdfNumPages : (project?.slides?.length || 0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "pptx"].includes(ext)) {
      alert("Only PDF and PPTX files are supported");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file directly to Supabase Storage (no size limit from Netlify)
      const fileUrl = await uploadDeckFile(projectId, file);

      // 2. Save the URL to our database via API
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save file info");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-file", projectId] });
      setActivePageIndex(0);
    } catch (err: any) {
      alert(err?.message || "Upload failed — check your connection and try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const runCompliance = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const runJudge = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const runFeedback = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
  });

  if (!project) return null;

  // No file uploaded — show upload prompt
  if (!project.hasUploadedFile && !project.uploadedFileName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold">My Presentation</h1>
        </div>

        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <FileUp className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Upload Your Presentation</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Upload your pitch deck or written event so the AI can grade your actual work.
            </p>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p><span className="font-medium text-foreground">PDF</span> — visual slide preview + AI grading</p>
              <p><span className="font-medium text-foreground">PPTX</span> — text-based view + AI grading</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.pptx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload PDF or PPTX
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Presentation className="h-5 w-5 text-blue-500" />
          <h1 className="text-lg font-bold">My Presentation</h1>
          <Badge variant="outline">
            {project.uploadedFileName}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.pptx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Replace
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runFeedback.mutate()}
            disabled={runFeedback.isPending}
          >
            {runFeedback.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            AI Feedback
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runCompliance.mutate()}
            disabled={runCompliance.isPending}
          >
            {runCompliance.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Compliance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runJudge.mutate()}
            disabled={runJudge.isPending}
          >
            {runJudge.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-1" />
            )}
            Judge Sim
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Slide Thumbnails (Left) */}
        <div className="w-48 shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePageIndex(i)}
                  className={`w-full aspect-video rounded-md overflow-hidden border-2 transition-all ${
                    activePageIndex === i
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {isPdf && pdfDataUrl ? (
                    <PdfSlidePreview
                      file={memoizedPdfFile}
                      pageNumber={i + 1}
                      width={170}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-blue-900 to-white flex flex-col">
                      <div className="px-2 py-1 flex-1 flex items-end">
                        <p className="text-[8px] font-semibold text-white truncate leading-tight">
                          {project?.slides?.[i]?.title || `Slide ${i + 1}`}
                        </p>
                      </div>
                      <div className="bg-white px-2 py-1 flex-[2]">
                        <p className="text-[7px] text-slate-600 line-clamp-2 leading-tight">
                          {(() => {
                            const slide = project?.slides?.[i];
                            if (!slide) return "";
                            const c = typeof slide.contentJson === "string"
                              ? JSON.parse(slide.contentJson) : slide.contentJson;
                            return c?.blocks?.[0]?.content || "";
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Slide View */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {fileLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isPdf && pdfDataUrl ? (
            <>
              {/* PDF Slide Image */}
              <div className="flex justify-center">
                <div className="w-full max-w-4xl rounded-lg overflow-hidden shadow-xl border border-border bg-white">
                  <PdfSlideMain
                    file={memoizedPdfFile}
                    pageNumber={activePageIndex + 1}
                    width={800}
                    onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex <= 0}
                  onClick={() => setActivePageIndex((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Slide {activePageIndex + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex >= totalPages - 1}
                  onClick={() => setActivePageIndex((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Extracted Text for this slide */}
              {project.slides?.[activePageIndex] && (
                <Card className="max-w-4xl mx-auto w-full">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Extracted Text — Slide {activePageIndex + 1}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {(() => {
                        const slide = project.slides[activePageIndex];
                        const content =
                          typeof slide.contentJson === "string"
                            ? JSON.parse(slide.contentJson)
                            : slide.contentJson;
                        return content?.blocks?.[0]?.content || "No text extracted";
                      })()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : project?.slides?.length > 0 ? (
            /* PPTX or fallback — show text-based slides */
            <>
              <div className="flex justify-center">
                <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-xl border border-border">
                  <div
                    className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 flex items-end"
                    style={{ height: "30%" }}
                  >
                    <h2 className="text-white text-2xl md:text-3xl font-bold">
                      {project.slides[activePageIndex]?.title || `Slide ${activePageIndex + 1}`}
                    </h2>
                  </div>
                  <div
                    className="bg-white px-8 py-6 overflow-auto"
                    style={{ height: "70%" }}
                  >
                    <p className="text-slate-700 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                      {(() => {
                        const slide = project.slides[activePageIndex];
                        if (!slide) return "";
                        const content =
                          typeof slide.contentJson === "string"
                            ? JSON.parse(slide.contentJson)
                            : slide.contentJson;
                        return content?.blocks?.[0]?.content || "";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex <= 0}
                  onClick={() => setActivePageIndex((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Slide {activePageIndex + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex >= totalPages - 1}
                  onClick={() => setActivePageIndex((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Tip for PPTX users */}
              {!isPdf && project.uploadedFileName && (
                <Card className="max-w-4xl mx-auto w-full border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Showing extracted text from your PPTX. For a visual preview of your actual slides, export as PDF and re-upload.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No slides found. Upload a PDF or PPTX to see your presentation.
            </div>
          )}

          {/* AI Feedback Results */}
          {runFeedback.data?.feedback && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 max-w-4xl mx-auto w-full">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">AI Feedback</p>
                <div className="space-y-2">
                  {runFeedback.data.feedback.map((fb: any, i: number) => (
                    <div key={i} className="text-sm">
                      <Badge variant="outline" className="text-xs mr-2">
                        {fb.severity}
                      </Badge>
                      {fb.content}
                      {fb.suggestion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Suggestion: {fb.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Judge Results */}
          {runJudge.data?.score && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 max-w-4xl mx-auto w-full">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">Judge Simulation</p>
                <div className="text-center mb-3">
                  <span className="text-3xl font-bold">
                    {runJudge.data.score.totalScore}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    /{runJudge.data.score.maxScore}
                  </span>
                </div>
                <p className="text-sm">{runJudge.data.score.overallNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Results */}
          {runCompliance.data?.score !== undefined && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 max-w-4xl mx-auto w-full">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">Compliance Check</p>
                <div className="text-center mb-3">
                  <span className="text-3xl font-bold">
                    {runCompliance.data.score}
                  </span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <p className="text-sm">{runCompliance.data.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
