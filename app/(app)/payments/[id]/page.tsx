import { notFound } from "next/navigation";
import { PaymentReturn } from "@/components/brand/payments/PaymentReturn";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

type Payment = components["schemas"]["Payment"];

/**
 * A card payment: where Gate-E sends the brand back (it adds ?payment_id=…&payment_code=…, which
 * aren't needed: the id is in the path), and where Campaigns and Balance open a pending one again.
 */
export default async function PaymentPage({ params }: PageProps<"/payments/[id]">) {
  const { id } = await params;
  const { t, f } = await getI18n();
  const [payment, ws] = await Promise.all([
    api<Payment>(`/payments/${id}`).catch((e: unknown) => {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
      throw e;
    }),
    workspace(),
  ]);
  const campaign = ws.campaign(payment.campaign_id ?? undefined);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <PageHeader title={t("payment.title")} />
      <PaymentReturn
        initial={payment}
        campaignTitle={campaign ? f.pick(campaign.title) || t("newCampaign.untitled") : undefined}
        campaignDraft={campaign?.status === "draft"}
      />
    </div>
  );
}
