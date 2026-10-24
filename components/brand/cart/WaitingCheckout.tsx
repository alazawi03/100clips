import { redirect } from "next/navigation";
import { CardPanel } from "@/components/brand/payments/CardPanel";
import { PayAgain } from "@/components/brand/payments/PayAgain";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

type Payment = components["schemas"]["Payment"];

/**
 * /checkout?payment=: a checkout whose card part is still waiting, where Back from BENEFIT's or Gate-E's own page
 * lands. The order as it was paid for (its campaign, creators and amounts) beside its payment panel, and "Start a new
 * payment" for BENEFIT, which allows one try per payment. Anything else (paid, failed, a top-up) goes to the payment
 * page, which says what happened.
 */
export async function WaitingCheckout({ paymentId }: { paymentId: string }) {
  const { t, f } = await getI18n();
  const [payment, ws] = await Promise.all([api<Payment>(`/payments/${paymentId}`).catch(() => undefined), workspace()]);
  if (!payment || payment.kind !== "checkout" || payment.status !== "pending" || !payment.pay_url) redirect(`/payments/${paymentId}`);
  const campaign = ws.campaign(payment.campaign_id ?? undefined);
  const picks = payment.picks ?? [];
  const fee = picks.reduce((sum, p) => sum + p.fee, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("checkout.title")} subtitle={t("payment.checkoutWaiting")} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <CardPanel url={payment.pay_url} paymentId={payment.id} back={`/checkout?payment=${payment.id}`} />
          <PayAgain paymentId={payment.id} then="checkout" />
        </div>
        <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
          <div className="flex flex-col gap-1">
            <p className="font-medium">{t("checkout.summary")}</p>
            {campaign && <p className="truncate text-small text-text-muted">{f.pick(campaign.title) || t("newCampaign.untitled")}</p>}
          </div>
          <ul className="flex flex-col gap-3">
            {picks.map((p) => {
              const creator = ws.creator(p.creator_id);
              const name = creator ? f.pick(creator.name) : "";
              return (
                <li key={p.creator_id} className="flex items-center gap-3 text-small">
                  <Avatar id={p.creator_id} name={name} src={creator?.photo} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}</span>
                    <span className="block truncate text-text-muted">{t(`formats.${p.format}`)}</span>
                  </span>
                  <span className="tabular-nums">{f.money(p.price + p.fee)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-border pt-3 text-small">
            <div className="flex justify-between gap-2 text-body">
              <dt className="font-medium">{t("cart.total")}</dt>
              <dd className="font-medium tabular-nums">{f.money(payment.total)}</dd>
            </div>
            {fee > 0 && (
              <div className="flex justify-between gap-2 text-text-muted">
                <dt>{t("payment.includesFee")}</dt>
                <dd className="tabular-nums">{f.money(fee)}</dd>
              </div>
            )}
            {payment.from_balance > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("checkout.fromBalance")}</dt>
                <dd className="tabular-nums">{f.signedMoney(-payment.from_balance)}</dd>
              </div>
            )}
            {payment.from_balance > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("checkout.byCard")}</dt>
                <dd className="tabular-nums">{f.money(payment.by_card)}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}
