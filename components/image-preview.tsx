"use client";

import { useState } from "react";

interface ImagePreviewProps {
  fileId: string;
  fileName: string;
  fileSize: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({ fileId, fileName, fileSize }: ImagePreviewProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div
          className="cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${fileId}/preview?w=600`}
            alt={fileName}
            className="h-48 w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatSize(fileSize)}
          </p>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1 shadow-lg dark:bg-gray-800"
            >
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${fileId}/preview?w=1200`}
              alt={fileName}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
