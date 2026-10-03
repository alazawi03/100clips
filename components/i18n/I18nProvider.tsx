"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dirOf, type Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/messages";

const LocaleContext = createContext<Locale | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Translator for Client Components. Format numbers and dates on the server and pass strings down. */
export function useI18n() {
  const locale = useContext(LocaleContext);
  if (!locale) throw new Error("useI18n must be used inside <I18nProvider>");
  return useMemo(() => ({ locale, dir: dirOf(locale), ...createTranslator(locale) }), [locale]);
}
