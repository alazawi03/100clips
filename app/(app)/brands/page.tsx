import { Plus } from "lucide-react";
import { BrandsTable } from "@/components/brand/brands/BrandsTable";
import { productView } from "@/components/brand/brands/productView";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getProduct, myBrands } from "@/lib/data/brandsApi";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandsPage({ searchParams }: PageProps<"/brands">) {
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const query = await searchParams;
  const done = typeof query.done === "string" ? query.done : undefined;
  const [brands, ws, doneProduct] = await Promise.all([
    myBrands(),
    workspace(),
    typeof query.product === "string" ? getProduct(query.product) : undefined,
  ]);
  const doneBrand = typeof query.brand === "string" ? brands.find((b) => b.id === query.brand) : undefined;
  // A product linked from elsewhere (e.g. Shipping): open its drawer.
  const showId = typeof query.show === "string" ? query.show : undefined;

  const rows = brands.map((brand) => {
    const products = ws.productsOf(brand.id);
    return {
      id: brand.id,
      name: f.pick(brand.name),
      logo: brand.logo,
      industry: t(`industries.${brand.industry}`),
      productsLabel: tp("brandsPage.products", products.length),
      products: products.map((p) => productView(p, i18n, ws)),
    };
  });

  // Open the brand the user just worked on, or the one with the linked product.
  const openId = doneProduct?.brandId ?? doneBrand?.id ?? rows.find((b) => b.products.some((p) => p.id === showId))?.id;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("brandsPage.title")} />

      {done === "brandCreated" && <Notice>{t("brandsPage.doneBrandCreated")}</Notice>}
      {done === "brandSaved" && doneBrand && <Notice>{t("brandsPage.doneBrandSaved", { name: f.pick(doneBrand.name) })}</Notice>}
      {done === "productAdded" && doneProduct && <Notice>{t("brandsPage.doneProductAdded", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productSaved" && doneProduct && <Notice>{t("brandsPage.doneProductSaved", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productDuplicated" && doneProduct && <Notice>{t("brandsPage.doneProductDuplicated", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productDeleted" && <Notice>{t("brandsPage.doneProductDeleted")}</Notice>}
      {done === "productInUse" && <Notice tone="info">{t("brandsPage.productInUse")}</Notice>}

      <section aria-labelledby="brands-title">
        <SectionHeader id="brands-title" title={t("brandsPage.myBrands")}>
          {rows.length > 0 && (
            <LinkButton href="/brands/new" variant="secondary" className="shrink-0">
              <Plus aria-hidden />
              {t("brandsPage.addBrand")}
            </LinkButton>
          )}
        </SectionHeader>
        {rows.length > 0 ? (
          <BrandsTable brands={rows} openId={openId} showId={showId} />
        ) : (
          <EmptyState
            title={t("brandsPage.noBrands")}
            hint={t("brandsPage.noBrandsHint")}
            action={
              <LinkButton href="/brands/new" variant="primary">
                <Plus aria-hidden />
                {t("brandsPage.createFirstBrand")}
              </LinkButton>
            }
          />
        )}
      </section>
    </div>
  );
}
