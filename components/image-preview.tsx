"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ImagePreviewProps {
  fileId: string;
  fileName: string;
}

export function ImagePreview({ fileId, fileName }: ImagePreviewProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="h-[80px] w-[80px] cursor-pointer overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--border)" }}
        onClick={() => setShowModal(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/files/${fileId}/preview?w=160`}
          alt={fileName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
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
