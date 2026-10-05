import { Plus } from "lucide-react";
import { BrandsTable } from "@/components/brand/brands/BrandsTable";
import { productView } from "@/components/brand/brands/productView";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { brands, getBrand, productsOf } from "@/lib/data/account";
import { getProduct } from "@/lib/data/brandsStore";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandsPage({ searchParams }: PageProps<"/brands">) {
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const query = await searchParams;
  const done = typeof query.done === "string" ? query.done : undefined;
  const doneProduct = typeof query.product === "string" ? getProduct(query.product) : undefined;
  const doneBrand = typeof query.brand === "string" ? getBrand(query.brand) : undefined;
  // Open the brand the user just worked on.
  const openId = doneProduct?.brandId ?? doneBrand?.id;

  const rows = brands.map((brand) => ({
    id: brand.id,
    name: f.pick(brand.name),
    logo: brand.logo,
    industry: t(`industries.${brand.industry}`),
    city: f.pick(brand.city),
    productsLabel: tp("brandsPage.products", productsOf(brand.id).length),
    products: productsOf(brand.id).map((p) => productView(p, i18n)),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("brandsPage.title")} />

      {done === "brandCreated" && <Notice>{t("brandsPage.doneBrandCreated")}</Notice>}
      {done === "brandSaved" && doneBrand && <Notice>{t("brandsPage.doneBrandSaved", { name: f.pick(doneBrand.name) })}</Notice>}
      {done === "productAdded" && doneProduct && <Notice>{t("brandsPage.doneProductAdded", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productSaved" && doneProduct && <Notice>{t("brandsPage.doneProductSaved", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productDuplicated" && doneProduct && <Notice>{t("brandsPage.doneProductDuplicated", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productDeleted" && <Notice>{t("brandsPage.doneProductDeleted")}</Notice>}

      <section aria-labelledby="brands-title">
        <SectionHeader id="brands-title" title={t("brandsPage.myBrands")}>
          <LinkButton href="/brands/new" variant="secondary" className="shrink-0">
            <Plus aria-hidden />
            {t("brandsPage.addBrand")}
          </LinkButton>
        </SectionHeader>
        <BrandsTable brands={rows} openId={openId} />
      </section>
    </div>
  );
}
