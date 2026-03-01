import { PostForm } from "@/components/post-form";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
        >
          파일 업로드
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          파일을 선택하고 정보를 입력해주세요
        </p>
      </div>
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}
      >
        <PostForm />
      </div>
    </div>
  );
}
