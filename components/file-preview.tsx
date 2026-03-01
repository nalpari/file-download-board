import { ImagePreview } from "@/components/image-preview";
import { PdfPreview } from "@/components/pdf-preview";
import {
  FileSpreadsheet,
  FileText,
  FileArchive,
  FileImage,
  File,
  Download,
} from "lucide-react";

interface FilePreviewProps {
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeInfo(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return { icon: FileImage, color: "#2563EB", bg: "#DBEAFE", label: "IMAGE" };
  if (mimeType === "application/pdf")
    return { icon: FileText, color: "#DC2626", bg: "#FEE2E2", label: "PDF" };
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return { icon: FileSpreadsheet, color: "#16A34A", bg: "#DCFCE7", label: "EXCEL" };
  if (mimeType.includes("word") || mimeType.includes("document"))
    return { icon: FileText, color: "#4F46E5", bg: "#E0E7FF", label: "WORD" };
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed"))
    return { icon: FileArchive, color: "#D97706", bg: "#FEF3C7", label: "ZIP" };
  return { icon: File, color: "#6B7280", bg: "#F3F4F6", label: "FILE" };
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
