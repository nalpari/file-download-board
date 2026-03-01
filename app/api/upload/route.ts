import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "파일을 선택해주세요." }, { status: 400 });
  }

  const maxFiles = Number(process.env.MAX_FILES_PER_POST) || 5;
  if (files.length > maxFiles) {
    return NextResponse.json(
      { error: `최대 ${maxFiles}개 파일만 허용됩니다.` },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const saved = await saveFile(file);
        return { originalName: file.name, ...saved };
      })
    );
    return NextResponse.json({ files: results });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
