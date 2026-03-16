"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
}: {
  slide: any;
  index: number;
  isActive: boolean;
  onClick: () => void;
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
      const text = await res.text();
      const data = JSON.parse(text.trim());
      if (data.error) throw new Error(data.error);
      return data;
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
          <h1 className="text-lg font-bold">Slide Editor</h1>
          <Badge variant="outline">
            {slides.length} slides
            {project?.event?.maxSlides
              ? ` / ${project.event.maxSlides} max`
              : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
                </div>
              </div>

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
              No slides yet. Click &quot;Add Slide&quot; to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
