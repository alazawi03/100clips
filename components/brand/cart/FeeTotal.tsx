"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { createFormatters } from "@/lib/i18n/format";
import { withFee } from "@/lib/fees";

/** What the brand pays for creators costing `creatorsTotal`: one total, service fee included (never shown on its own). A <dl> row. */
export function FeeTotal({ creatorsTotal }: { creatorsTotal: number }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  return (
    <div className="flex justify-between gap-2 text-body">
      <dt className="font-medium">{t("cart.total")}</dt>
      <dd className="font-medium tabular-nums">{f.money(withFee(creatorsTotal))}</dd>
    </div>
  );
}
