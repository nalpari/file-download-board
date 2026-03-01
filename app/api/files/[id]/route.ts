import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.file.findUnique({
    where: { id },
    include: { post: true },
  });

  if (!file) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const filePath = path.resolve(file.path);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "파일이 서버에 존재하지 않습니다." }, { status: 404 });
  }

  // 다운로드 카운트 증가
  await prisma.post.update({
    where: { id: file.postId },
    data: { downloadCount: { increment: 1 } },
  });

  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "Content-Length": String(file.size),
    },
  });
}
