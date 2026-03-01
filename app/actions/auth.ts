"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "모든 필드를 입력해주세요." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "이미 등록된 이메일입니다." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  redirect("/login");
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if ((error as Error).message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
}
