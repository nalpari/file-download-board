"use client";

import { deletePost } from "@/app/actions/posts";
import { Trash2 } from "lucide-react";

export function DeletePostButton({ postId }: { postId: string }) {
  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-base"
      style={{ border: "1px solid var(--border)", color: "var(--error)" }}
    >
      <Trash2 size={14} />
      삭제
    </button>
  );
}
