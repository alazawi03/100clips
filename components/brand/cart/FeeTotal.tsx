"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { createFormatters } from "@/lib/i18n/format";
import { SERVICE_FEE_RATE, serviceFee, withFee } from "@/lib/fees";

/** What the brand pays for creators costing `creatorsTotal`: the total, then the laqta fee it includes. <dl> rows. */
export function FeeTotal({ creatorsTotal }: { creatorsTotal: number }) {
  const { t, locale, currency } = useI18n();
  const f = createFormatters(locale, currency);
  return (
    <>
      <div className="flex justify-between gap-2 text-body">
        <dt className="font-medium">{t("cart.total")}</dt>
        <dd className="font-medium tabular-nums">{f.money(withFee(creatorsTotal))}</dd>
      </div>
      <div className="flex justify-between gap-2 text-small text-text-muted">
        <dt>{t("cart.includesFee", { rate: `${f.number(SERVICE_FEE_RATE * 100)}%` })}</dt>
        <dd className="tabular-nums">{f.money(serviceFee(creatorsTotal))}</dd>
      </div>
    </>
  );
}
