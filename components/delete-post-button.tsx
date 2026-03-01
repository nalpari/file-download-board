"use client";

import { deletePost } from "@/app/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      삭제
    </button>
  );
}
