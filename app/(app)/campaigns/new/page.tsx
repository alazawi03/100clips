import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import { inviteView, pickerLists } from "@/components/brand/campaigns/campaignView";
import { NeedBrandOnArrival } from "@/components/brand/campaigns/NeedBrandDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { NICHES } from "@/lib/data/creatorFilters";
import { cardOnline, workspace } from "@/lib/data/live";
import type { ContentFormat } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";
import { nextDay, today } from "@/lib/today";
import { checkoutBrands } from "@/components/brand/cart/checkoutBrands";

/**
 * "New campaign": pick the creators (the same picker as "Add creator" and "Run again"), set up the
 * campaign, and pay, all without the cart. Saved as a draft at any point; ?draft= picks one up again.
 */
export default async function NewCampaignPage({ searchParams }: PageProps<"/campaigns/new">) {
  const i18n = await getI18n();
  const { t, f } = i18n;
  const [ws, online] = await Promise.all([workspace(), cardOnline()]);
  const raw = (await searchParams).draft;
  const draft = typeof raw === "string" ? ws.campaigns.find((c) => c.id === raw && c.status === "draft") : undefined;
  const lists = await pickerLists(ws, i18n);

  // A draft comes back as it was saved: its fields (references one per field) and its chosen creators.
  const values = draft?.draft?.values ?? {};
  const references = (values.references ?? "").split("\n").filter(Boolean);
  const initialValues = { ...values, ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) };
  const picks = draft?.draft?.picks ?? [];

  // A campaign needs a brand (and a product) to advertise: say so first, in a dialog.
  if (ws.brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("newCampaign.title")} subtitle={t("newCampaign.subtitle")} />
        <NeedBrandOnArrival then="campaign" back="/campaigns" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={draft ? f.pick(draft.title) || t("newCampaign.untitled") : t("newCampaign.title")} subtitle={t("newCampaign.subtitle")} />
      <CheckoutForm
        creators={[]}
        brands={checkoutBrands(ws, i18n)}
        initial={draft ? { brandId: values.brandId ?? draft.brandId, productId: values.productId, values: initialValues } : undefined}
        minDeadline={nextDay(today())}
        total={0}
        balance={ws.balance}
        cardOnline={online}
        picker={{
          lists,
          explore: { creators: ws.bookable.map((c) => inviteView(c, i18n)), niches: NICHES.map((n) => ({ id: n, label: t(`niches.${n}`) })) },
          initialListId: lists.find((l) => l.creators.length > 0)?.id ?? "explore",
          initialPicked: picks.map((p) => p.creatorId),
          defaultFormats: Object.fromEntries(picks.map((p) => [p.creatorId, p.format])) as Record<string, ContentFormat>,
          draftId: draft?.id,
        }}
      />
    </div>
  );
}
