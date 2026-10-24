"use client";

import { useEffect, useState } from "react";
import { benefitPage, checkPayment } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** A backup to Gate-E sending the brand back: how often to ask whether the payment went through. */
const CHECK_MS = 10_000;

/**
 * After paying with a card part, when Gate-E is set up: its payment page inside laqta's. Cards (with the
 * bank's code step, which Gate-E shows in its own frame) and BenefitPay are paid right here. BENEFIT's
 * page refuses to be shown inside another site, so "Pay with BENEFIT" opens it in the whole tab
 * (Gate-E's page instead if the API can't get it, where the brand picks BENEFIT); BENEFIT picked inside
 * the panel ends up the same way, through Gate-E's page. Either way Gate-E sends the brand back to
 * /payments/{id}, which takes over the tab when it lands in this frame. Meanwhile laqta checks now and
 * then, and Gate-E's close button ends here too; both go to /payments/{id} for the result. The link
 * opens Gate-E's page in the tab if the frame doesn't show it.
 */
export function CardPanel({ url, paymentId }: { url: string; paymentId: string }) {
  const { t } = useI18n();
  const [toBenefit, setToBenefit] = useState(false);

  useEffect(() => {
    const result = () => window.location.replace(`/payments/${paymentId}`);
    const onMessage = (e: MessageEvent) => {
      if (e.origin === new URL(url).origin && e.data?.action === "paymentCancelled") result();
    };
    addEventListener("message", onMessage);
    const timer = setInterval(async () => {
      const now = await checkPayment(paymentId).catch(() => undefined);
      if (now && now.status !== "pending") result();
    }, CHECK_MS);
    return () => {
      removeEventListener("message", onMessage);
      clearInterval(timer);
    };
  }, [url, paymentId]);

  async function payWithBenefit() {
    setToBenefit(true);
    window.location.assign(await benefitPage(paymentId).catch(() => url));
  }

  return (
    <Card className="flex flex-col gap-4 overflow-hidden px-0 pb-4 pt-5">
      <div className="flex flex-col gap-1 px-5">
        <h2 className="text-h2 font-medium">{t("payment.panelTitle")}</h2>
        <p className="text-text-muted">{t("payment.panelBody")}</p>
      </div>
      <div className="mx-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-text-muted">{t("payment.benefitHint")}</p>
        <Button variant="secondary" onClick={payWithBenefit} disabled={toBenefit} aria-busy={toBenefit} className="shrink-0">
          {t("payment.benefitButton")}
        </Button>
      </div>
      <iframe src={url} title={t("payment.panelTitle")} allow="payment" className="h-[720px] w-full border-0 bg-surface" />
      <p className="px-5 text-small text-text-muted">
        {t("payment.panelTrouble")}{" "}
        <a href={url} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("payment.openPage")}
        </a>
      </p>
    </Card>
  );
}
