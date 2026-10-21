"use client";
import { supabaseBrowser } from "./supabase-browser";

/** Resizes a photo in the browser (max 1600 px, JPEG) before upload. Keeps the original if it can't be read. */
export async function shrink(file: File, max = 1600, quality = 0.86): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", quality));
  } catch { return file; }
}

const ext = (b: Blob) => (b.type === "image/png" ? "png" : b.type === "image/webp" ? "webp" : "jpg");

/** Uploads to the public bucket and returns the public address. */
export async function uploadPublic(file: File, folder: string): Promise<string> {
  const blob = await shrink(file);
  const path = `${folder}/${crypto.randomUUID()}.${ext(blob)}`;
  const db = supabaseBrowser();
  const { error } = await db.storage.from("kraft-public").upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return db.storage.from("kraft-public").getPublicUrl(path).data.publicUrl;
}

/** Uploads to the private bucket and returns the storage path (shown via short-lived links). */
export async function uploadPrivate(file: File, folder: string): Promise<string> {
  const blob = await shrink(file, 2000);
  const path = `${folder}/${crypto.randomUUID()}.${ext(blob)}`;
  const { error } = await supabaseBrowser().storage.from("kraft-private").upload(path, blob, { contentType: blob.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Short-lived links for private photos. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabaseBrowser().storage.from("kraft-private").createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).filter((x) => x.signedUrl && x.path).map((x) => [x.path as string, x.signedUrl as string]));
}

/** wa.me number for a Qatar mobile typed by a customer. */
export const waNumber = (phone: string) => { const d = phone.replace(/\D/g, ""); return d.length === 8 ? `974${d}` : d; };
