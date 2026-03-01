import { getPost } from "@/app/actions/posts";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const post = await getPost(id);
  if (!post) notFound();

  const isOwner = session.user.id === post.authorId;
  const isAdmin = (session.user as { role?: string })?.role === "ADMIN";

  if (!isOwner && !isAdmin) redirect("/");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-50">
        게시글 수정
      </h1>
      <PostForm
        initialData={{
          id: post.id,
          title: post.title,
          content: post.content,
          files: post.files,
        }}
      />
    </div>
  );
}
