"use client";

import { adminDeletePost } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

export function AdminDeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("이 게시글을 삭제하시겠습니까?")) {
      await adminDeletePost(postId);
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
    >
      삭제
    </button>
  );
}
