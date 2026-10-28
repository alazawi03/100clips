"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { currencyOf } from "@/lib/data/markets";
import { dirOf, type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/messages";

const LocaleContext = createContext<{ locale: Locale; country?: string } | null>(null);

/** `country`: the signed-in brand account's (BH, KW), whose money amounts are in. */
export function I18nProvider({ locale, country, children }: { locale: Locale; country?: string; children: ReactNode }) {
  const value = useMemo(() => ({ locale, country }), [locale, country]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Translator for Client Components, with the account's country and money (`currency`, for createFormatters). Format
 * numbers and dates on the server and pass strings down.
 */
export function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  const { locale, country } = value;
  return useMemo(() => ({ locale, dir: dirOf(locale), country, currency: currencyOf(country), ...createTranslator(locale) }), [locale, country]);
}
