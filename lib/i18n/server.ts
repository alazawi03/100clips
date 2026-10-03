import { cookies } from "next/headers";
import { defaultLocale, dirOf, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { createFormatters } from "./format";
import { createTranslator } from "./messages";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Translator and formatters for Server Components. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, dir: dirOf(locale), ...createTranslator(locale), f: createFormatters(locale) };
}

export type I18n = Awaited<ReturnType<typeof getI18n>>;
