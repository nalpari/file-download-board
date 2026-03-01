"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileText } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfPreviewProps {
  fileId: string;
  fileName: string;
}

export function PdfPreview({ fileId, fileName }: PdfPreviewProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="flex h-[80px] w-[80px] flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: "#FEE2E2" }}
      >
        <FileText size={32} style={{ color: "#DC2626" }} />
        <span className="mt-1 text-[10px] font-semibold" style={{ color: "#DC2626" }}>PDF</span>
      </div>
    );
  }

  return (
    <div
      className="h-[80px] w-[80px] overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
    >
      <Document
        file={`/api/files/${fileId}/preview`}
        loading={
          <div className="flex h-full w-full items-center justify-center">
            <FileText size={24} style={{ color: "#DC2626" }} />
          </div>
        }
        onLoadError={() => setError(true)}
      >
        <Page
          pageNumber={1}
          width={80}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
