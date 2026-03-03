import type { LucideIcon } from "lucide-react";
import {
  FileImage,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
} from "lucide-react";

// --- Format utilities ---

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- File type classification ---

export type FileCategory = "image" | "pdf" | "excel" | "word" | "zip" | "file";

interface FileTypeInfo {
  category: FileCategory;
  label: string;
  badgeClass: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const FILE_TYPE_MAP: Record<FileCategory, Omit<FileTypeInfo, "category">> = {
  image: { label: "IMAGE", badgeClass: "badge-image", icon: FileImage, color: "#2563EB", bg: "#DBEAFE" },
  pdf: { label: "PDF", badgeClass: "badge-pdf", icon: FileText, color: "#DC2626", bg: "#FEE2E2" },
  excel: { label: "EXCEL", badgeClass: "badge-excel", icon: FileSpreadsheet, color: "#16A34A", bg: "#DCFCE7" },
  word: { label: "WORD", badgeClass: "badge-word", icon: FileText, color: "#4F46E5", bg: "#E0E7FF" },
  zip: { label: "ZIP", badgeClass: "badge-zip", icon: FileArchive, color: "#D97706", bg: "#FEF3C7" },
  file: { label: "FILE", badgeClass: "badge-default", icon: File, color: "#6B7280", bg: "#F3F4F6" },
};

export function classifyMimeType(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "excel";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed")) return "zip";
  return "file";
}

export function getFileTypeInfo(mimeType: string): FileTypeInfo {
  const category = classifyMimeType(mimeType);
  return { category, ...FILE_TYPE_MAP[category] };
}

// --- Auth utilities ---

export function isAdminUser(user: unknown): boolean {
  return (user as { role?: string })?.role === "ADMIN";
}
