import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PREVIEW_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const file = await prisma.file.findUnique({
    where: { id },
    select: { mimeType: true, path: true, size: true },
  });

  if (!file) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!PREVIEW_MIME_TYPES.includes(file.mimeType)) {
    return NextResponse.json(
      { error: "미리보기를 지원하지 않는 파일 형식입니다." },
      { status: 404 }
    );
  }

  const filePath = path.resolve(file.path);

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "파일이 서버에 존재하지 않습니다." }, { status: 404 });
  }

  // PDF: 원본 파일 그대로 반환 (미리보기 전용, 다운로드 카운트 미증가)
  if (file.mimeType === "application/pdf") {
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(file.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 이미지: sharp로 리사이즈
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
