"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Sparkles,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileImage,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Dynamically import PDF components (no SSR — pdfjs needs browser APIs)
const PdfSlidePreview = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfSlidePreview),
  { ssr: false }
);
const PdfSlideMain = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfSlideMain),
  { ssr: false }
);

/* ── Helper: get content text from a slide ── */
function getSlideContent(slide: any): string {
  const c =
    typeof slide.contentJson === "string"
      ? JSON.parse(slide.contentJson)
      : slide.contentJson;
  return c?.blocks?.[0]?.content || "";
}

/* ── Mini slide thumbnail (sidebar) ── */
function SortableSlideItem({
  slide,
  index,
  isActive,
  onClick,
  pdfUrl,
}: {
  slide: any;
  index: number;
  isActive: boolean;
  onClick: () => void;
  pdfUrl: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const contentPreview = getSlideContent(slide);

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1.5">
      <div className="flex flex-col items-center pt-2 shrink-0">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 opacity-40" />
        </button>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {index + 1}
        </span>
      </div>

      <button
        onClick={onClick}
        className={`flex-1 aspect-video rounded-md overflow-hidden border-2 transition-all text-left ${
          isActive
            ? "border-primary ring-2 ring-primary/30"
            : "border-border hover:border-primary/50"
        }`}
      >
        {pdfUrl ? (
          <PdfSlidePreview
            file={{ url: pdfUrl }}
            pageNumber={index + 1}
            width={170}
          />
        ) : (
          <>
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-1">
              <p className="text-[8px] font-semibold text-white truncate leading-tight">
                {slide.title || "Untitled"}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-100 px-2 py-1 flex-1">
              <p className="text-[7px] text-slate-600 line-clamp-2 leading-tight">
                {contentPreview || "Empty slide"}
              </p>
            </div>
          </>
        )}
      </button>
    </div>
  );
}

/* ── Main page ── */
export default function SlidesPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      return res.json();
    },
  });

  // Check if a PDF file exists for this project
  const { data: pdfCheck } = useQuery({
    queryKey: ["project-pdf", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/file`, {
        method: "HEAD",
      });
      return { hasPdf: res.ok };
    },
    staleTime: 60000,
  });

  const pdfUrl = pdfCheck?.hasPdf
    ? `/api/projects/${projectId}/file`
    : null;

  // Memoize so react-pdf Document doesn't re-mount on every render
  const memoizedPdfFile = useMemo(() => pdfUrl ? { url: pdfUrl } : null, [pdfUrl]);

  const slides = project?.slides || [];
  const activeSlide =
    slides.find((s: any) => s.id === activeSlideId) || slides[0];
  const activeIndex = slides.findIndex(
    (s: any) => s.id === (activeSlideId || slides[0]?.id)
  );

  const initSlide = useCallback((slide: any) => {
    if (!slide) return;
    setActiveSlideId(slide.id);
    setEditTitle(slide.title || "");
    setEditContent(getSlideContent(slide));
    setEditNotes(slide.notesText || "");
  }, []);

  if (slides.length > 0 && !activeSlideId) {
    initSlide(slides[0]);
  }

  const saveSlideToServer = useCallback(
    async (slideId: string, title: string, content: string, notes: string) => {
      await fetch(`/api/projects/${projectId}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideId,
          title,
          contentJson: { blocks: [{ type: "text", content }] },
          notesText: notes,
        }),
      });
    },
    [projectId]
  );

  const saveSlide = useMutation({
    mutationFn: async () => {
      const id = activeSlideId || activeSlide?.id;
      if (!id) return;
      await saveSlideToServer(id, editTitle, editContent, editNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const switchSlide = useCallback(
    (slide: any) => {
      const currentId = activeSlideId || activeSlide?.id;
      if (currentId && currentId !== slide.id) {
        saveSlideToServer(currentId, editTitle, editContent, editNotes).then(
          () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
          }
        );
      }
      initSlide(slide);
    },
    [
      activeSlideId,
      activeSlide,
      editTitle,
      editContent,
      editNotes,
      saveSlideToServer,
      initSlide,
      queryClient,
      projectId,
    ]
  );

  const addSlide = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Slide" }),
      });
      return res.json();
    },
    onSuccess: (newSlide) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      switchSlide(newSlide);
    },
  });

  const reorderSlides = useMutation({
    mutationFn: async (newOrder: string[]) => {
      await fetch(`/api/projects/${projectId}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: newOrder }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = slides.findIndex((s: any) => s.id === active.id);
      const newIndex = slides.findIndex((s: any) => s.id === over.id);
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      queryClient.setQueryData(["project", projectId], (old: any) => ({
        ...old,
        slides: newSlides,
      }));
      reorderSlides.mutate(newSlides.map((s: any) => s.id));
    },
    [slides, projectId, queryClient, reorderSlides]
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-pdf", projectId] });
      setActiveSlideId(null);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getAiSuggestion = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          slideId: activeSlideId || activeSlide?.id,
          content: `Slide: ${editTitle}\nContent: ${editContent}`,
        }),
      });
      return res.json();
    },
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold">Pitch Deck Editor</h1>
          <Badge variant="outline">
            {slides.length} slides
            {project?.event?.maxSlides
              ? ` / ${project.event.maxSlides} max`
              : ""}
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
            Upload Deck
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => getAiSuggestion.mutate()}
            disabled={getAiSuggestion.isPending}
          >
            {getAiSuggestion.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            AI Feedback
          </Button>
          <Button
            size="sm"
            onClick={() => saveSlide.mutate()}
            disabled={saveSlide.isPending}
          >
            {saveSlide.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* ── Slide Thumbnails (Left Panel) ── */}
        <div className="w-52 shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={slides.map((s: any) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {slides.map((slide: any, i: number) => (
                    <SortableSlideItem
                      key={slide.id}
                      slide={slide}
                      index={i}
                      isActive={
                        (activeSlideId || slides[0]?.id) === slide.id
                      }
                      onClick={() => switchSlide(slide)}
                      pdfUrl={pdfUrl}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => addSlide.mutate()}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Slide
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* ── Main Editor ── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {activeSlide ? (
            <>
              {/* Slide Canvas */}
              <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                  {pdfUrl ? (
                    /* PDF image of the actual slide */
                    <div className="rounded-lg overflow-hidden shadow-xl border border-border bg-white">
                      <PdfSlideMain
                        file={memoizedPdfFile}
                        pageNumber={activeIndex + 1}
                        width={800}
                      />
                    </div>
                  ) : (
                    /* Text-only slide canvas (no PDF uploaded) */
                    <div className="aspect-video rounded-lg overflow-hidden shadow-xl border border-border">
                      <div
                        className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 flex items-end"
                        style={{ height: "30%" }}
                      >
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-transparent text-white text-2xl md:text-3xl font-bold placeholder:text-white/40 outline-none border-none caret-white"
                          placeholder="Slide Title"
                        />
                      </div>
                      <div
                        className="bg-white dark:bg-slate-50 px-8 py-6"
                        style={{ height: "70%" }}
                      >
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-full resize-none bg-transparent text-slate-700 text-sm md:text-base outline-none border-none placeholder:text-slate-300 leading-relaxed"
                          placeholder="Enter your slide content here..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted text editor (shown when PDF is present) */}
              {pdfUrl && (
                <div className="max-w-4xl mx-auto w-full grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Slide Title
                    </p>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Slide Title"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Extracted Text
                    </p>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      placeholder="Extracted slide text..."
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Speaker Notes */}
              <div className="max-w-4xl mx-auto w-full">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Speaker Notes
                </p>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Add speaker notes for this slide..."
                  className="text-sm"
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex <= 0}
                  onClick={() => switchSlide(slides[activeIndex - 1])}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Slide {activeIndex + 1} of {slides.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex >= slides.length - 1}
                  onClick={() => switchSlide(slides[activeIndex + 1])}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* AI Feedback */}
              {getAiSuggestion.data?.feedback && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 max-w-4xl mx-auto w-full">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium mb-2">AI Feedback</p>
                    <div className="space-y-2">
                      {getAiSuggestion.data.feedback.map(
                        (fb: any, i: number) => (
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
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No slides yet. Click &quot;Add Slide&quot; or &quot;Upload
              Deck&quot; to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
