"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Borderless like the other top-bar buttons. */
export function LanguageToggle({ className }: { className?: string }) {
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
        "grid size-11 place-items-center rounded-full text-small font-medium transition-opacity hover:bg-surface",
        pending && "opacity-60",
        className,
      )}
    >
      {t("header.languageShort")}
    </button>
  );
}
