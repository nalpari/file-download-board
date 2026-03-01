import { PostForm } from "@/components/post-form";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-50">
        새 게시글 작성
      </h1>
      <PostForm />
    </div>
  );
}
