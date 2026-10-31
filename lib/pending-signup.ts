/**
 * Signing up with an email that already signs in to laqta (in the laqta app or the admin portal): Supabase makes no
 * second login, so the password and name typed can't go on it until the email's owner opens the link we send
 * (app/actions/auth.ts). Until then they wait in this browser only: a cookie encrypted with SIGNUP_COOKIE_KEY
 * (AES-GCM, server only), httpOnly, sent to /auth/callback alone, for an hour. Never stored anywhere else, never in a
 * link. Opened elsewhere or later, there's no cookie, and they choose the password on /reset-password instead.
 */
import { cookies } from "next/headers";

export const PENDING_COOKIE = "laqta_signup";
export const PENDING_PATH = "/auth/callback";
const MAX_AGE_S = 60 * 60;

type Pending = { email: string; password: string; name: string };

const encode = (text: string) => new TextEncoder().encode(text);
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (text: string) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** The AES-GCM key from SIGNUP_COOKIE_KEY (any long random string, hashed to 256 bits); none when it isn't set. */
async function key(): Promise<CryptoKey | undefined> {
  const secret = process.env.SIGNUP_COOKIE_KEY;
  if (!secret) return undefined;
  const raw = await crypto.subtle.digest("SHA-256", encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** From the sign-up Server Action. False without a key: the link then leads to choosing the password. */
export async function keepPendingSignup(pending: Pending): Promise<boolean> {
  const k = await key();
  if (!k) return false;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = encode(JSON.stringify({ ...pending, email: pending.email.toLowerCase(), until: Date.now() + MAX_AGE_S * 1000 }));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encode(PENDING_COOKIE) }, k, body));
  (await cookies()).set(PENDING_COOKIE, `${toB64(iv)}.${toB64(sealed)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: PENDING_PATH,
    maxAge: MAX_AGE_S,
  });
  return true;
}

/** The cookie's sign-up, unless it's missing, tampered with or past its hour. */
export async function readPendingSignup(value: string | undefined): Promise<Pending | undefined> {
  const k = await key();
  const [iv, sealed] = value?.split(".") ?? [];
  if (!k || !iv || !sealed) return undefined;
  try {
    const opened = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv), additionalData: encode(PENDING_COOKIE) }, k, fromB64(sealed));
    const pending = JSON.parse(new TextDecoder().decode(opened)) as Pending & { until: number };
    if (!(pending.until > Date.now())) return undefined;
    return { email: pending.email, password: pending.password, name: pending.name };
  } catch {
    return undefined;
  }
}
