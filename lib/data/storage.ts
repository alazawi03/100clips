import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase Storage from Server Actions, as the signed-in user. Storage only lets people write in
 * their own folder ({user id}/...), and the API only accepts paths there.
 *   public-media: logos and product photos (public links)
 *   private-docs: VAT certificates (the owner and admins only)
 */

const PUBLIC_PREFIX = `${supabaseUrl}/storage/v1/object/public/public-media/`;

/** The link to show a public-media file. */
export function publicUrl(path: string | null | undefined): string | undefined {
  return path ? PUBLIC_PREFIX + path : undefined;
}

/** A link shown on the page back to its storage path; undefined for anything else. */
export function pathOfPublicUrl(url: string): string | undefined {
  return url.startsWith(PUBLIC_PREFIX) ? url.slice(PUBLIC_PREFIX.length) : undefined;
}

const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" };

async function upload(bucket: "public-media" | "private-docs", folder: string, bytes: Blob, type: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in first");
  const path = `${data.user.id}/${folder}/${crypto.randomUUID()}.${EXTENSIONS[type] ?? "bin"}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: type });
  if (error) throw error;
  return path;
}

/**
 * An image from a form: a new upload (a resized data URL from the browser) is stored and its path
 * returned; an image already in storage keeps its path. Anything else gives undefined.
 */
export async function storeImage(value: string, folder: string): Promise<string | undefined> {
  const existing = pathOfPublicUrl(value);
  if (existing) return existing;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(value);
  if (!match) return undefined;
  return upload("public-media", folder, new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), match[1]);
}

/** A private document (the VAT certificate). */
export async function storeDocument(file: File, folder: string): Promise<string> {
  return upload("private-docs", folder, file, file.type);
}
