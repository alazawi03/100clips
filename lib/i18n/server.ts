import { cookies } from "next/headers";
import { defaultLocale, dirOf, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { currencyOf } from "@/lib/data/markets";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/session";
import { createFormatters } from "./format";
import { createTranslator } from "./messages";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/**
 * The signed-in brand account's country (BH, KW), which its money is in; none when signed out or before the account
 * exists (Bahrain's money then). The session is read from the cookie, so signed-out pages ask the API nothing.
 */
export async function getMarket(): Promise<string | undefined> {
  const { data } = await (await createClient()).auth.getSession();
  if (!data.session) return undefined;
  return (await getMe().catch(() => undefined))?.account.country ?? undefined;
}

/** Translator and formatters for Server Components; money in the account's own. */
export async function getI18n() {
  const [locale, country] = await Promise.all([getLocale(), getMarket()]);
  const currency = currencyOf(country);
  return { locale, dir: dirOf(locale), country, currency, ...createTranslator(locale), f: createFormatters(locale, currency) };
}

export type I18n = Awaited<ReturnType<typeof getI18n>>;
