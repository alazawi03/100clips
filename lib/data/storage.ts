import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

/**
 * Files live in Cloudflare R2. From Server Actions: the API gives a one-time upload link for the
 * signed-in user (POST /uploads picks the path in their own folder), the file goes straight to R2,
 * and the path is saved with its record.
 *   public files: logos and product photos (fixed links under NEXT_PUBLIC_MEDIA_URL)
 *   private files: VAT certificates (the owner and admins, through short-lived links)
 */

type Upload = components["schemas"]["Upload"];
type UploadKind = components["schemas"]["UploadKind"];

const PUBLIC_PREFIX = `${(process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/$/, "")}/`;

/** The link to show a public file. */
export function publicUrl(path: string | null | undefined): string | undefined {
  return path ? PUBLIC_PREFIX + path : undefined;
}

/** A link shown on the page back to its storage path; undefined for anything else. */
export function pathOfPublicUrl(url: string): string | undefined {
  return url.startsWith(PUBLIC_PREFIX) ? url.slice(PUBLIC_PREFIX.length) : undefined;
}

async function upload(kind: UploadKind, bytes: Blob, type: string): Promise<string> {
  const link = await api<Upload>("/uploads", { method: "POST", body: { kind, content_type: type, size: bytes.size } });
  const res = await fetch(link.upload_url, { method: "PUT", headers: link.headers, body: bytes });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return link.path;
}

/**
 * An image from a form: a new upload (a resized data URL from the browser) is stored and its path
 * returned; an image already in storage keeps its path. Anything else gives undefined.
 */
export async function storeImage(value: string, kind: "logo" | "product_photo"): Promise<string | undefined> {
  const existing = pathOfPublicUrl(value);
  if (existing) return existing;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(value);
  if (!match) return undefined;
  return upload(kind, new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), match[1]);
}

/** A private document (the VAT certificate). */
export async function storeDocument(file: File): Promise<string> {
  return upload("vat_certificate", file, file.type);
}

/** A private file to view for an hour, if the signed-in user may see it. */
export async function privateLink(area: "private-docs" | "clips", path: string | null | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  return (await api<{ url: string }>(`/files/link?area=${area}&path=${encodeURIComponent(path)}`)).url;
}
