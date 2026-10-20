"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiOrNothing } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Me } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** error: a translation key. values: what was typed (never the password), to show it again. sentTo: a link went to this email. */
export type AuthFormState = { error?: MessageKey; values?: Record<string, string>; sentTo?: string } | null;

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

/** Only paths inside the dashboard, so a crafted link can't send people elsewhere. */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function origin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Supabase's error codes, in words for people. */
function authError(code: string | undefined): MessageKey {
  switch (code) {
    case "invalid_credentials":
      return "auth.errors.invalid";
    case "email_not_confirmed":
      return "auth.errors.notConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "auth.errors.exists";
    case "weak_password":
      return "auth.errors.weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "auth.errors.tooMany";
    case "email_address_invalid":
      return "auth.errors.emailInvalid";
    default:
      return "auth.errors.failed";
  }
}

export async function signIn(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = text(form, "email");
  const values = { email };
  if (!isEmail(email)) return { error: "auth.errors.emailInvalid", values };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(form.get("password") ?? "") });
  if (error) return { error: authError(error.code), values };
  // An admin: signed out again right here, and the form says why (no trip through /auth/brands-only).
  const me = await apiOrNothing<Me>("/me").catch(() => undefined);
  if (me?.account.role === "admin") {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "auth.errors.brandsOnly", values };
  }
  redirect(safeNext(text(form, "next")));
}

/** Supabase emails a confirmation link; it opens /auth/callback, which signs them in and goes on to onboarding. */
export async function signUp(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const name = text(form, "name");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  const values = { name, email };
  if (!name) return { error: "auth.errors.nameRequired", values };
  if (!isEmail(email)) return { error: "auth.errors.emailInvalid", values };
  if (password.length < 8) return { error: "auth.errors.weakPassword", values };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: authError(error.code), values };
  // An existing email comes back without identities (Supabase doesn't say so, to protect privacy).
  if (data.user && data.user.identities?.length === 0) return { error: "auth.errors.exists", values };
  // Confirmation off in Supabase: already signed in.
  if (data.session) redirect("/onboarding");
  return { sentTo: email };
}

export async function sendPasswordReset(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = text(form, "email");
  if (!isEmail(email)) return { error: "auth.errors.emailInvalid", values: { email } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  if (error) return { error: authError(error.code), values: { email } };
  // The same answer whether or not the email has an account.
  return { sentTo: email };
}

/** After the reset link signed them in. */
export async function updatePassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "auth.errors.weakPassword" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authError(error.code) };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
