import { Welcome } from "@/components/brand/home/Welcome";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandFilter } from "@/components/brand/BrandFilter";
import { myBrands, productsOf } from "@/lib/data/brandsApi";
import { getI18n } from "@/lib/i18n/server";

/**
 * The brand's home. Campaigns and orders aren't on the API yet, so every account is at the start:
 * the welcome (how it works, one way in, and what's left to set up for each brand). Results, what
 * needs them now and clips to review come back here with the campaigns and orders slices.
 */
export default async function BrandHome({ searchParams }: PageProps<"/dashboard">) {
  const i18n = await getI18n();
  const brands = await myBrands();
  const raw = (await searchParams).brand;
  const brandId = brands.length > 1 && brands.some((b) => b.id === raw) ? (raw as string) : undefined;
  const shown = brandId ? brands.filter((b) => b.id === brandId) : brands;
  const productCounts = Object.fromEntries(await Promise.all(shown.map(async (b) => [b.id, (await productsOf(b.id)).length] as const)));

  return (
    <div className="flex flex-col gap-10">
      {brands.length > 1 && <BrandFilter brands={brands.map((b) => ({ id: b.id, name: i18n.f.pick(b.name), logo: b.logo }))} value={brandId} />}
      <PageHeader title={i18n.t("nav.dashboard")} />
      <Welcome brands={shown} productCounts={productCounts} i18n={i18n} />
    </div>
  );
}
