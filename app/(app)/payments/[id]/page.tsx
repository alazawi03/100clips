import { notFound } from "next/navigation";
import { PaymentReturn } from "@/components/brand/payments/PaymentReturn";
import { RenewPayment } from "@/components/brand/payments/RenewPayment";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

type Payment = components["schemas"]["Payment"];

/**
 * A card payment: where Gate-E sends the brand back (it adds ?payment_id=…&payment_code=…; the id is in
 * the path, so they only say the brand is back from paying), and where Campaigns and Balance open a
 * pending one again, to pay it in the payment panel.
 */
export default async function PaymentPage({ params, searchParams }: PageProps<"/payments/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const returned = !!query.payment_id;
  const { t, f } = await getI18n();
  const [payment, ws] = await Promise.all([
    api<Payment>(`/payments/${id}`).catch((e: unknown) => {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
      throw e;
    }),
    workspace(),
  ]);
  const campaign = ws.campaign(payment.campaign_id ?? undefined);
  // Back from BENEFIT's or Gate-E's page (?renew=1, set by CardPanel): a fresh payment unless it went through.
  const renew = query.renew === "1" && payment.provider === "gate-e" && (payment.status === "pending" || payment.status === "failed");
  const view = (
    <PaymentReturn
      initial={payment}
      returned={returned}
      campaignTitle={campaign ? f.pick(campaign.title) || t("newCampaign.untitled") : undefined}
      campaignDraft={campaign?.status === "draft"}
    />
  );
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <PageHeader title={t("payment.title")} />
      {renew ? (
        <RenewPayment paymentId={payment.id} then="payment">
          {view}
        </RenewPayment>
      ) : (
        view
      )}
    </div>
  );
}
