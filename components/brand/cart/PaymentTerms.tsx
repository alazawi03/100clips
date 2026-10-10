"use client";

import { Pin, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * What the brand gets for what it pays, beside the pay button: one revision per clip, and how the clips
 * are used (posted on the creator's own account, kept up).
 */
export function PaymentTerms() {
  const { t } = useI18n();
  const lines = [
    { icon: RotateCcw, text: t("checkout.revisionNote") },
    { icon: Pin, text: t("checkout.usageNote") },
  ];
  return (
    <ul className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface p-3 text-small text-text-muted">
      {lines.map(({ icon: Icon, text }) => (
        <li key={text} className="flex gap-2">
          <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {text}
        </li>
      ))}
    </ul>
  );
}
