"use client";

import { CircleAlert, CircleCheck, CreditCard, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { checkPayment, type PaymentView } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { CardPanel } from "@/components/brand/payments/CardPanel";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createFormatters } from "@/lib/i18n/format";

/** Gate-E's answer usually comes within seconds; after about two minutes the brand checks by hand. */
const POLL_MS = 3000;
const POLL_TRIES = 40;

/**
 * A card payment, back from Gate-E's page (`returned`) or opened again from Campaigns or Balance. Back from
 * Gate-E, it asks the API (which asks Gate-E) every few seconds for a while; opened again, once. Still
 * pending on Gate-E after that, it's paid here in the payment panel (CardPanel, with Pay with BENEFIT).
 * Paid or failed, it says so and where to go next. Without Gate-E, laqta sends a payment link.
 */
export function PaymentReturn({ initial, returned, campaignTitle, campaignDraft }: {
  initial: PaymentView;
  returned: boolean;
  campaignTitle?: string;
  campaignDraft: boolean;
}) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [payment, setPayment] = useState(initial);
  const [tries, setTries] = useState(0);
  const online = payment.provider === "gate-e" && !!payment.pay_url;

  // Paid inside the payment panel (CardPanel): Gate-E sends the brand back here within its frame, so
  // this page takes over the whole tab (next.config lets only laqta's own pages frame /payments).
  useEffect(() => {
    if (window.top && window.top !== window.self) window.top.location.replace(window.location.href);
  }, []);
  const waiting = payment.status === "pending" && online;
  const checking = waiting && tries < (returned ? POLL_TRIES : 1);

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

  if (waiting && !checking) {
    return (
      <div className="flex flex-col items-center gap-4">
        <CardPanel url={payment.pay_url!} paymentId={payment.id} />
        <Link href={next.href} className={buttonClass("ghost")}>
          {next.label}
        </Link>
      </div>
    );
  }

  return (
    <Card role="status" aria-live="polite" className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <Icon aria-hidden className={`size-12 ${tone} ${Icon === LoaderCircle ? "motion-safe:animate-spin" : ""}`} strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-medium">{title}</h2>
        {campaignTitle && <p className="font-medium">{campaignTitle}</p>}
        <p className="text-text-muted">{body}</p>
      </div>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        <Link href={next.href} className={buttonClass(waiting ? "ghost" : "primary")}>
          {next.label}
        </Link>
      </div>
    </Card>
  );
}
