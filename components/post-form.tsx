"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/actions/posts";
import { FileUpload } from "@/components/file-upload";

interface UploadedFile {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}

interface ExistingFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}

interface PostFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    files: ExistingFile[];
  };
}

export function PostForm({ initialData }: PostFormProps) {
  const isEdit = !!initialData;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(
    initialData?.files ?? []
  );
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleRemoveExisting(fileId: string) {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    setDeletedFileIds((prev) => [...prev, fileId]);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        formData.set("newFiles", JSON.stringify(files));
        for (const id of deletedFileIds) {
          formData.append("deleteFileIds", id);
        }
        const result = await updatePost(initialData.id, formData);
        if (result && "error" in result) {
          setError(result.error);
          setSubmitting(false);
        }
      } else {
        formData.set("files", JSON.stringify(files));
        const result = await createPost(formData);
        if (result && "error" in result) {
          setError(result.error);
          setSubmitting(false);
        }
      }
    } catch {
      setError(isEdit ? "게시글 수정 중 오류가 발생했습니다." : "게시글 작성 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={initialData?.title}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          placeholder="제목을 입력하세요"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={10}
          defaultValue={initialData?.content}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          placeholder="내용을 입력하세요"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          파일 첨부
        </label>

        {existingFiles.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">기존 파일</p>
            <ul className="space-y-2">
              {existingFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {file.originalName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(file.id)}
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FileUpload onFilesUploaded={setFiles} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "저장 중..." : initialData ? "수정" : "작성"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}
