import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import type { InviteCreator } from "@/components/brand/campaigns/CreatorPicker";
import { NeedBrandOnArrival } from "@/components/brand/campaigns/NeedBrandDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { account, brands, DEMO_TODAY, productsOf } from "@/lib/data/account";
import { campaigns } from "@/lib/data/campaigns";
import { NICHES } from "@/lib/data/creatorFilters";
import { bookableCreators } from "@/lib/data/creators";
import { allLists, creatorsIn } from "@/lib/data/lists";
import type { ContentFormat, Creator } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

/** "2026-10-03" → "2026-10-04". */
function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * "New campaign": pick the creators (the same picker as "Add creator" and "Run again"), set up the
 * campaign, and pay, all without the cart. Saved as a draft at any point; ?draft= picks one up again.
 */
export default async function NewCampaignPage({ searchParams }: PageProps<"/campaigns/new">) {
  const { t, f } = await getI18n();
  const raw = (await searchParams).draft;
  const draft = typeof raw === "string" ? campaigns.find((c) => c.id === raw && c.status === "draft") : undefined;

  const view = (c: Creator): InviteCreator => ({
    id: c.id,
    name: f.pick(c.name),
    handle: c.handle,
    city: f.pick(c.city),
    niches: c.niches,
    inCampaign: false,
    showsFace: c.showsFace,
    packages: c.formats.map((o) => ({ format: o.format, label: t(`formats.${o.format}`), price: o.price })),
  });
  const lists = allLists().map((l) => ({ id: l.id, name: l.favorites ? t("lists.favorites") : l.name, creators: creatorsIn(l).map(view) }));

  // A draft comes back as it was saved: its fields (references one per field) and its chosen creators.
  const values = draft?.draft?.values ?? {};
  const references = (values.references ?? "").split("\n").filter(Boolean);
  const initialValues = { ...values, ...Object.fromEntries(references.map((r, i) => [`reference-${i}`, r])) };
  const picks = draft?.draft?.picks ?? [];

  // A campaign needs a brand (and a product) to advertise: say so first, in a dialog.
  if (brands.length === 0) {
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
        brands={brands.map((b) => ({
          id: b.id,
          name: f.pick(b.name),
          logo: b.logo,
          products: productsOf(b.id).map((p) => ({ id: p.id, name: f.pick(p.name), typeLabel: t(`productForm.types.${p.details.type}`), photo: p.photos[0], type: p.details.type, downloadLink: p.details.type === "app" ? p.details.downloadLink : undefined, mapUrl: p.details.type === "venue" ? p.details.mapUrl : undefined, price: p.price !== undefined ? f.money(p.price) : undefined })),
        }))}
        initial={draft ? { brandId: values.brandId ?? draft.brandId, productId: values.productId, values: initialValues } : undefined}
        minDeadline={nextDay(DEMO_TODAY)}
        total={0}
        balance={account.balance}
        picker={{
          lists,
          explore: { creators: bookableCreators().map(view), niches: NICHES.map((n) => ({ id: n, label: t(`niches.${n}`) })) },
          initialListId: lists.find((l) => l.creators.length > 0)?.id ?? "explore",
          initialPicked: picks.map((p) => p.creatorId),
          defaultFormats: Object.fromEntries(picks.map((p) => [p.creatorId, p.format])) as Record<string, ContentFormat>,
          draftId: draft?.id,
        }}
      />
    </div>
  );
}
