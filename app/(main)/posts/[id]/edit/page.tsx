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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
        >
          게시글 수정
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          게시글 내용을 수정합니다
        </p>
      </div>
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}
      >
        <PostForm
          initialData={{
            id: post.id,
            title: post.title,
            content: post.content,
            files: post.files,
          }}
        />
      </div>
    </div>
  );
}
