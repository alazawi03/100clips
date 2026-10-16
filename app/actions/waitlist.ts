"use server";

import { api } from "@/lib/api";
import { isActiveMarket } from "@/lib/data/markets";
import { createClient } from "@/lib/supabase/server";

/**
 * "I'm not in Bahrain": puts the signed-in brand owner on the waitlist for their country, reachable at
 * their sign-in email (or phone). Same list as the creator app's "tell me when you launch".
 */
export async function joinWaitlist(country: string): Promise<{ ok: boolean }> {
  const code = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || isActiveMarket(code)) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const contact = data.user?.email ?? data.user?.phone;
  if (!contact) return { ok: false };
  try {
    await api("/waitlist", { method: "POST", body: { country: code, contact } });
    return { ok: true };
  } catch (e) {
    console.error("joinWaitlist failed", e);
    return { ok: false };
  }
}
