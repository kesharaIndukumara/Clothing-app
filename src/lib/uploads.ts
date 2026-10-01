import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Images are stored in /uploads on the server's disk and served by
// app/uploads/[...path]/route.ts. In Phase 3 swap this for Cloudinary or R2.

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveImage(file: File) {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error(`${file.name}: only JPG, PNG, WebP or AVIF images are allowed`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: images must be under 5 MB`);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function deleteImage(url: string) {
  if (!url.startsWith("/uploads/")) return; // seed images live in /public
  const name = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
