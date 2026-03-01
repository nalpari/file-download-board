import { ImagePreview } from "@/components/image-preview";
import { PdfPreview } from "@/components/pdf-preview";

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

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  return "📎";
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="group relative">
      {isImage ? (
        <ImagePreview
          fileId={file.id}
          fileName={file.originalName}
          fileSize={file.size}
        />
      ) : isPdf ? (
        <PdfPreview fileId={file.id} fileName={file.originalName} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-48 flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
            <span className="text-4xl">{getFileIcon(file.mimeType)}</span>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
            </p>
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatSize(file.size)}
            </p>
          </div>
        </div>
      )}

      <a
        href={`/api/files/${file.id}`}
        download
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        다운로드
      </a>
    </div>
  );
}
