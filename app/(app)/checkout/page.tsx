import { redirect } from "next/navigation";
import { NeedBrandOnArrival } from "@/components/brand/campaigns/NeedBrandDialog";
import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import { WaitingCheckout } from "@/components/brand/cart/WaitingCheckout";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { getCheckoutStart } from "@/lib/data/checkoutStart";
import { cardOnline, priceCart, shopping } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";
import { nextDay, today } from "@/lib/today";
import { checkoutBrands } from "@/components/brand/cart/checkoutBrands";

type Payment = components["schemas"]["Payment"];
type CampaignRow = components["schemas"]["Campaign"];
type Draft = { values: Record<string, string>; picks: unknown[] };

/**
 * A checkout of exactly these creators still waiting for its card, newest first, with its draft campaign's saved
 * form: what checkout opens at the payment step to go on with (Back from BENEFIT's page lands here, as does the
 * cart's button). Undefined when there's none.
 */
async function waitingCheckout(creatorIds: string[]) {
  const want = [...creatorIds].sort().join();
  const payments = await api<Payment[]>("/me/payments?status=pending").catch(() => []);
  const payment = payments.find((p) => p.kind === "checkout" && p.campaign_id && (p.picks ?? []).map((x) => x.creator_id).sort().join() === want);
  if (!payment?.campaign_id) return undefined;
  const row = await api<CampaignRow>(`/campaigns/${payment.campaign_id}`).catch(() => undefined);
  const draft = row?.status === "draft" ? (row.draft as Draft | null) : null;
  if (!row || !draft?.values) return undefined;
  const references = (draft.values.references ?? "").split("\n").filter(Boolean);
  return {
    draftId: row.id,
    initial: {
      brandId: draft.values.brandId ?? row.brand_id,
      productId: draft.values.productId,
      values: { ...draft.values, ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) },
    },
  };
}

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  // Back from BENEFIT's or Gate-E's page: the checkout whose card part is waiting (WaitingCheckout).
  const { payment, renew } = await searchParams;
  if (typeof payment === "string") return <WaitingCheckout paymentId={payment} renew={renew === "1"} />;
  const i18n = await getI18n();
  const { t, f } = i18n;
  const [ws, online] = await Promise.all([shopping(), cardOnline()]);
  const { lines, total } = priceCart(ws);
  if (lines.length === 0) redirect("/cart");

  const creators = lines.map((l) => ({
    id: l.creator.id,
    name: f.pick(l.creator.name),
    subtotal: l.subtotal,
    summary: l.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator")),
  }));

  const waiting = await waitingCheckout(lines.map((l) => l.creator.id));

  // No brand yet (the address bar, or the last one deleted): the dialog first; "Not now" goes back to the cart.
  if (ws.brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
        <NeedBrandOnArrival then="checkout" back="/cart" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
      <CheckoutForm
        creators={creators}
        brands={checkoutBrands(ws, i18n)}
        // A waiting checkout of these creators goes on (at the payment step); else "Find creators for this product".
        initial={waiting?.initial ?? (await getCheckoutStart())}
        resume={waiting && { draftId: waiting.draftId }}
        minDeadline={nextDay(today())}
        total={total}
        balance={ws.balance}
        cardOnline={online}
      />
    </div>
  );
}
