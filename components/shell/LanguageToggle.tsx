"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      aria-label={t("header.switchLanguage")}
      title={t("header.switchLanguage")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      className={cn(
        "grid h-9 min-w-11 place-items-center rounded-full border border-border px-3 text-small font-medium transition-opacity hover:bg-surface",
        pending && "opacity-60",
      )}
    >
      {t("header.languageShort")}
    </button>
  );
}
