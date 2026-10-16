import type { BrandValues } from "@/components/brand/brands/BrandFields";
import type { ProductValues } from "@/components/brand/products/ProductForm";
import type { Locale } from "@/lib/i18n/config";
import type { Brand, Product } from "./types";

/** Turns stored records into the plain strings the brand and product forms start from. */
export function brandToValues(b: Brand, locale: Locale): BrandValues {
  return {
    nameAr: b.name.ar,
    nameEn: b.name.en,
    logo: b.logo,
    industry: b.industry,
    about: b.about?.[locale],
    website: b.website,
    instagram: b.instagram,
    tiktok: b.tiktok,
    countries: b.countries,
    // Per country: cr_bh, vat_bh, … (the form's field names).
    ...Object.fromEntries(
      Object.entries(b.registrations ?? {}).flatMap(([country, r]) => [
        [`cr_${country}`, r?.crNumber],
        [`vat_${country}`, r?.vatCertificate],
      ]),
    ),
  };
}

export function productToValues(p: Product, locale: Locale): ProductValues {
  const d = p.details;
  return {
    type: d.type,
    name: p.name[locale],
    photo: p.photos,
    description: p.description?.[locale],
    currency: p.currency,
    priceModel: p.pricing?.model,
    price: p.pricing && "amount" in p.pricing ? p.pricing.amount?.toString() : undefined,
    priceMax: p.pricing?.model === "range" ? p.pricing.maxAmount.toString() : undefined,
    pricePeriod: p.pricing && "period" in p.pricing ? p.pricing.period : undefined,
    priceUnit: p.pricing?.model === "per_unit" ? p.pricing.unit : undefined,
    trialDays: p.pricing?.model === "subscription" ? p.pricing.trialDays?.toString() : undefined,
    benefit: p.benefits,
    concernQ: p.concerns.map((c) => c.question),
    concernA: p.concerns.map((c) => c.answer ?? ""),
    size: d.type === "physical" ? d.size : undefined,
    downloadLink: d.type === "app" ? d.downloadLink : undefined,
    platforms: d.type === "app" ? d.platforms : undefined,
    delivery: d.type === "service" ? d.delivery : undefined,
    venueKind: d.type === "venue" ? d.kind : undefined,
    location: d.type === "venue" ? d.location : undefined,
    hours: d.type === "venue" ? d.hours : undefined,
    mapUrl: d.type === "venue" ? d.mapUrl : undefined,
  };
}
