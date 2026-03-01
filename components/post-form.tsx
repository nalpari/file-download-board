"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/actions/posts";
import { FileUpload } from "@/components/file-upload";
import { X } from "lucide-react";

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

  const inputStyle = {
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const focusStyle = "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent";

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={initialData?.title}
          className={`w-full rounded-lg px-3.5 py-2.5 text-sm ${focusStyle}`}
          style={inputStyle}
          placeholder="제목을 입력하세요"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={8}
          defaultValue={initialData?.content}
          className={`w-full rounded-lg px-3.5 py-2.5 text-sm ${focusStyle}`}
          style={inputStyle}
          placeholder="내용을 입력하세요"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          파일 첨부
        </label>

        {existingFiles.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>기존 파일</p>
            <ul className="space-y-2">
              {existingFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {file.originalName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(file.id)}
                    className="ml-2 flex-shrink-0 transition-base"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FileUpload onFilesUploaded={setFiles} />
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", color: "var(--error)" }}
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-5 py-2.5 text-sm font-medium transition-base"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-base disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          {submitting ? "저장 중..." : initialData ? "수정" : "업로드"}
        </button>
      </div>
    </form>
  );
}
