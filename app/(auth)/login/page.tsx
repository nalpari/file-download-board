"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsPending(true);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        계정이 없으신가요?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
