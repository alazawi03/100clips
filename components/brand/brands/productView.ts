import { campaigns } from "@/lib/data/campaigns";
import type { Product, ProductType } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/** Everything the product card and drawer show, already translated, so the client components stay plain. */
export type ProductView = {
  id: string;
  brandId: string;
  name: string;
  type: ProductType;
  typeLabel: string;
  price?: string;
  photos: string[];
  description?: string;
  link?: string;
  /** Google Maps link, for venues. */
  mapUrl?: string;
  benefits: string[];
  concerns: Array<{ question: string; answer?: string }>;
  info: Array<{ label: string; value: string }>;
  campaigns: Array<{ id: string; title: string; status: string; clips: string }>;
  campaignsLabel: string;
  clipsLabel: string;
};

export function productView(product: Product, { t, tp, f }: I18n): ProductView {
  const d = product.details;
  const info: ProductView["info"] = [];
  if (d.type === "physical") {
    if (d.value !== undefined) info.push({ label: t("productForm.value"), value: f.money(d.value) });
    if (d.size) info.push({ label: t("productForm.size"), value: d.size });
  } else if (d.type === "app") {
    if (d.platforms.length) info.push({ label: t("productForm.platforms"), value: d.platforms.map((p) => t(`productForm.appPlatforms.${p}`)).join(t("common.separator")) });
  } else if (d.type === "service") {
    if (d.delivery.length) info.push({ label: t("productForm.delivery"), value: d.delivery.map((x) => t(`productForm.deliveries.${x}`)).join(t("common.separator")) });
  } else {
    info.push({ label: t("productForm.venueKind"), value: t(`productForm.venueKinds.${d.kind}`) });
    if (d.location) info.push({ label: t("productForm.location"), value: d.location });
    if (d.hours) info.push({ label: t("productForm.hours"), value: d.hours });
  }

  const using = campaigns.filter((c) => c.productIds?.includes(product.id));
  const clips = using.reduce((n, c) => n + c.deliveredClips, 0);

  return {
    id: product.id,
    brandId: product.brandId,
    name: f.pick(product.name),
    type: d.type,
    typeLabel: t(`productForm.types.${d.type}`),
    price: product.price !== undefined ? f.money(product.price) : undefined,
    photos: product.photos,
    description: product.description ? f.pick(product.description) : undefined,
    link: d.type === "app" ? d.downloadLink : undefined,
    mapUrl: d.type === "venue" ? d.mapUrl : undefined,
    benefits: product.benefits,
    concerns: product.concerns,
    info,
    campaigns: using.map((c) => ({
      id: c.id,
      title: f.pick(c.title),
      status: t(`status.campaign.${c.status}`),
      clips: t("brandHome.clipsProgress", { done: f.number(c.deliveredClips), total: f.number(c.clipsCount) }),
    })),
    campaignsLabel: tp("brandsPage.statCampaigns", using.length),
    clipsLabel: tp("brandsPage.statClips", clips),
  };
}
