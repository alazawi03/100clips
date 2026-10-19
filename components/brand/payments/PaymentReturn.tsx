"use client";

import { CircleAlert, CircleCheck, CreditCard, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { checkPayment, type PaymentView } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createFormatters } from "@/lib/i18n/format";

/** Gate-E's answer usually comes within seconds; after about two minutes the brand checks by hand. */
const POLL_MS = 3000;
const POLL_TRIES = 40;

/**
 * A card payment, back from Gate-E's page or opened again from Campaigns or Balance. While it's
 * pending on Gate-E, it asks the API (which asks Gate-E) every few seconds and offers the page again;
 * then it says paid or failed and where to go next. Without Gate-E, laqta sends a payment link.
 */
export function PaymentReturn({ initial, campaignTitle, campaignDraft }: { initial: PaymentView; campaignTitle?: string; campaignDraft: boolean }) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [payment, setPayment] = useState(initial);
  const [tries, setTries] = useState(0);
  const online = payment.provider === "gate-e" && !!payment.pay_url;
  const checking = payment.status === "pending" && online && tries < POLL_TRIES;

  useEffect(() => {
    if (!checking) return;
    const timer = setTimeout(async () => {
      const now = await checkPayment(payment.id).catch(() => undefined);
      if (now) setPayment(now);
      setTries((n) => n + 1);
    }, tries === 0 ? 0 : POLL_MS);
    return () => clearTimeout(timer);
  }, [checking, tries, payment.id]);

  const topUp = payment.kind === "top_up";
  const next =
    topUp || !payment.campaign_id
      ? { href: "/balance", label: t("nav.balance") }
      : payment.status === "paid"
        ? { href: `/campaigns/${payment.campaign_id}`, label: t("checkout.viewCampaign") }
        : campaignDraft
          ? { href: "/campaigns", label: t("campaignsPage.title") }
          : { href: `/campaigns/${payment.campaign_id}`, label: t("payment.backToCampaign") };

  const [Icon, tone, title, body] =
    payment.status === "paid"
      ? [CircleCheck, "text-success", t("campaignDetail.paidTitle"), topUp ? t("payment.paidTopUp", { amount: f.money(payment.by_card) }) : tp("campaignDetail.paidSentTo", payment.picks?.length ?? 0)]
      : payment.status === "failed"
        ? [CircleAlert, "text-error", t("payment.failedTitle"), t("payment.failedBody")]
        : online
          ? [checking ? LoaderCircle : CreditCard, "text-primary", t("payment.waitingTitle"), checking ? t("payment.checking") : t("payment.notPaidYet")]
          : [CreditCard, "text-primary", t("campaignDetail.cardPendingTitle"), topUp ? t("walletPage.topUpByLink") : t("checkout.cardByLink")];

  return (
    <Card role="status" aria-live="polite" className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <Icon aria-hidden className={`size-12 ${tone} ${Icon === LoaderCircle ? "motion-safe:animate-spin" : ""}`} strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-medium">{title}</h2>
        {campaignTitle && <p className="font-medium">{campaignTitle}</p>}
        <p className="text-text-muted">{body}</p>
      </div>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        {payment.status === "pending" && online && (
          <a href={payment.pay_url!} className={buttonClass("primary")}>
            {t("payment.payNow", { amount: f.money(payment.by_card) })}
          </a>
        )}
        {payment.status === "pending" && online && !checking && (
          <Button variant="secondary" onClick={() => setTries(0)}>
            {t("payment.checkAgain")}
          </Button>
        )}
        <Link href={next.href} className={buttonClass(payment.status === "pending" && online ? "ghost" : "primary")}>
          {next.label}
        </Link>
      </div>
    </Card>
  );
}
