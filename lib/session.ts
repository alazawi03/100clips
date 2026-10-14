import { cache } from "react";
import { redirect } from "next/navigation";
import { api, apiOrNothing } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { createClient } from "@/lib/supabase/server";

export type Me = components["schemas"]["Me"];

/** The signed-in Supabase user (email, name from sign-up or Google). Once per request. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/** Account, creator profile and brands from the API, or undefined before onboarding. Once per request. */
export const getMe = cache(() => apiOrNothing<Me>("/me"));

/** For the brand dashboard's pages: a brand owner (or admin) account, else onboarding. */
export async function requireBrandAccount(): Promise<Me> {
  const me = await getMe();
  if (!me || me.account.role === "creator") redirect("/onboarding");
  return me;
}

/** First visit after sign-up: make the brand owner's account, named as they signed up. */
export async function ensureBrandAccount(): Promise<Me> {
  const existing = await getMe();
  if (existing) return existing;
  const user = await getUser();
  const meta = (user?.user_metadata ?? {}) as { name?: string; full_name?: string };
  const name = (meta.name ?? meta.full_name ?? "").trim().slice(0, 80);
  const arabic = /[؀-ۿ]/.test(name);
  const account = await api<Me["account"]>("/me", { method: "POST", body: { role: "brand", ...(name ? { [arabic ? "name_ar" : "name_en"]: name } : {}) } });
  // Not GET /me again: Next.js reuses a GET's answer within one render, which was "no account yet".
  return { account, creator: null, brands: [] };
}

/** The person's name to show: their language first, then the other, then the email. */
export function displayName(me: Me, locale: string, email?: string | null) {
  const { name_ar, name_en } = me.account;
  return (locale === "ar" ? name_ar || name_en : name_en || name_ar) || email || "";
}
