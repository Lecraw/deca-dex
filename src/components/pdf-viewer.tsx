"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, FileImage } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfSlidePreview({
  file,
  pageNumber,
  width,
}: {
  file: { url: string } | null;
  pageNumber: number;
  width: number;
}) {
  if (!file) return null;

  return (
    <Document file={file} loading={null} error={null}>
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </div>
        }
      />
    </Document>
  );
}

export function PdfSlideMain({
  file,
  pageNumber,
  width,
}: {
  file: { url: string } | null;
  pageNumber: number;
  width: number;
}) {
  if (!file) return null;

  return (
    <Document
      file={file}
      loading={
        <div className="aspect-video flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
      error={
        <div className="aspect-video flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">
            Could not load PDF preview
          </p>
        </div>
      }
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={
          <div className="aspect-video flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      />
    </Document>
  );
}
