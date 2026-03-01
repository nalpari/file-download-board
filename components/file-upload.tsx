"use client";

import { useState, useRef, useCallback } from "react";

interface UploadedFile {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  maxFiles?: number;
}

export function FileUpload({
  onFilesUploaded,
  existingFiles = [],
  maxFiles = 5,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] =
    useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFiles = useCallback(
    (files: File[]): File[] | null => {
      setError(null);
      const remaining = maxFiles - uploadedFiles.length;

      if (remaining <= 0) {
        setError(`최대 ${maxFiles}개 파일만 업로드할 수 있습니다.`);
        return null;
      }

      const validFiles = files.slice(0, remaining);

      for (const file of validFiles) {
        if (file.size > MAX_SIZE) {
          setError(`${file.name}: 파일 크기가 10MB를 초과합니다.`);
          return null;
        }
      }

      if (files.length > remaining) {
        setError(
          `${remaining}개 파일만 추가할 수 있습니다. 초과분은 무시됩니다.`
        );
      }

      return validFiles;
    },
    [uploadedFiles.length, maxFiles]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const validFiles = validateFiles(files);
      if (!validFiles || validFiles.length === 0) return;

      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      validFiles.forEach((file) => formData.append("files", file));

      try {
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadedFile[]>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              resolve(data.files);
            } else {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "업로드 실패"));
            }
          };

          xhr.onerror = () => reject(new Error("네트워크 오류"));

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        const newFiles = [...uploadedFiles, ...result];
        setUploadedFiles(newFiles);
        onFilesUploaded(newFiles);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [validateFiles, uploadedFiles, onFilesUploaded]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      onFilesUploaded(newFiles);
    },
    [uploadedFiles, onFilesUploaded]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      uploadFiles(files);
      e.target.value = "";
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <svg
          className="mb-2 h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="mt-1 text-xs text-gray-400">
          최대 {maxFiles}개, 파일당 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>업로드 중...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {uploadedFiles.length > 0 && (
        <ul className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
