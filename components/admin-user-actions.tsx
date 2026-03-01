"use client";

import { updateUserRole, deleteUser } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

export function UserRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

  const handleToggle = async () => {
    await updateUserRole(userId, newRole as "USER" | "ADMIN");
    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      className={`rounded px-2 py-1 text-xs font-medium ${
        currentRole === "ADMIN"
          ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {currentRole} → {newRole}
    </button>
  );
}

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("이 사용자를 삭제하시겠습니까? 모든 게시글과 파일도 함께 삭제됩니다.")) {
      await deleteUser(userId);
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
