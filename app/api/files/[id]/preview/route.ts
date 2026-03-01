import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id } });

  if (!file) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미지가 아닌 경우 404
  if (!IMAGE_MIME_TYPES.includes(file.mimeType)) {
    return NextResponse.json(
      { error: "미리보기를 지원하지 않는 파일 형식입니다." },
      { status: 404 }
    );
  }

  const filePath = path.resolve(file.path);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "파일이 서버에 존재하지 않습니다." }, { status: 404 });
  }

  // URL 파라미터로 크기 조정
  const { searchParams } = new URL(req.url);
  const width = Math.min(Number(searchParams.get("w")) || 800, 1200);

  try {
    const resized = await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return new Response(new Uint8Array(resized), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "이미지 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
