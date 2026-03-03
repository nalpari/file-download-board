import { ImagePreview } from "@/components/image-preview";
import { PdfPreview } from "@/components/pdf-preview";
import { Download } from "lucide-react";
import { formatSize, getFileTypeInfo } from "@/lib/utils";

interface FilePreviewProps {
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const typeInfo = getFileTypeInfo(file.mimeType);

  return (
    <div className="flex items-center gap-3 rounded-lg p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-primary)" }}>
      {/* Thumbnail 128x128 */}
      <div className="flex-shrink-0">
        {isImage ? (
          <ImagePreview fileId={file.id} fileName={file.originalName} />
        ) : isPdf ? (
          <PdfPreview fileId={file.id} fileName={file.originalName} />
        ) : (
          <div
            className="flex h-[80px] w-[80px] flex-col items-center justify-center rounded-lg"
            style={{ backgroundColor: typeInfo.bg }}
          >
            <typeInfo.icon size={32} style={{ color: typeInfo.color }} />
            <span className="mt-1 text-[10px] font-semibold" style={{ color: typeInfo.color }}>
              {typeInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* File info + download */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {file.originalName}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {formatSize(file.size)}
        </p>
        <a
          href={`/api/files/${file.id}`}
          download
          className="mt-2 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-base"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <Download size={12} />
          다운로드
        </a>
      </div>
    </div>
  );
}
