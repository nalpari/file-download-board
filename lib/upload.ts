import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

export function getUploadDir(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return path.join(UPLOAD_DIR, yearMonth);
}

export function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
}

export async function saveFile(
  file: File
): Promise<{ storedName: string; path: string; size: number; mimeType: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다.`);
  }

  const dir = getUploadDir();
  await fs.mkdir(dir, { recursive: true });

  const storedName = generateStoredName(file.name);
  const filePath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return { storedName, path: filePath, size: file.size, mimeType: file.type };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    /* File may not exist */
  }
}
