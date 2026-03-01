"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-48 items-center justify-center bg-gray-50 dark:bg-gray-800">
        {error ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PDF를 불러올 수 없습니다.
          </p>
        ) : (
          <Document
            file={`/api/files/${fileId}`}
            loading={
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDF 로딩 중...
              </p>
            }
            onLoadError={() => setError(true)}
          >
            <Page
              pageNumber={1}
              width={280}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">PDF 문서</p>
      </div>
    </div>
  );
}
