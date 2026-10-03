import Image from "next/image";
import Link from "next/link";
import { Check, Pencil, Plus } from "lucide-react";
import { selectBrand } from "@/app/actions/account";
import { ProductCard } from "@/components/brand/brands/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Notice } from "@/components/ui/Notice";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { brands, getBrand, productsOf } from "@/lib/data/account";
import { getProduct } from "@/lib/data/brandsStore";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandsPage({ searchParams }: PageProps<"/brands">) {
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const current = await getCurrentBrand();
  const query = await searchParams;
  const done = typeof query.done === "string" ? query.done : undefined;
  const doneProduct = typeof query.product === "string" ? getProduct(query.product) : undefined;
  const doneBrand = typeof query.brand === "string" ? getBrand(query.brand) : undefined;
  const products = productsOf(current.id);
  const currentName = f.pick(current.name);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("brandsPage.title")} />

      {done === "brandCreated" && <Notice>{t("brandsPage.doneBrandCreated", { name: currentName })}</Notice>}
      {done === "brandSaved" && doneBrand && <Notice>{t("brandsPage.doneBrandSaved", { name: f.pick(doneBrand.name) })}</Notice>}
      {done === "productAdded" && doneProduct && <Notice>{t("brandsPage.doneProductAdded", { name: f.pick(doneProduct.name) })}</Notice>}
      {done === "productSaved" && doneProduct && <Notice>{t("brandsPage.doneProductSaved", { name: f.pick(doneProduct.name) })}</Notice>}

      <section aria-labelledby="brands-title">
        <SectionHeader id="brands-title" title={t("brandsPage.myBrands")}>
          <LinkButton href="/brands/new" variant="secondary" className="shrink-0">
            <Plus aria-hidden />
            {t("brandsPage.addBrand")}
          </LinkButton>
        </SectionHeader>
        <ul className="grid gap-4 md:grid-cols-2">
          {brands.map((brand) => {
            const name = f.pick(brand.name);
            const isCurrent = brand.id === current.id;
            return (
              <li key={brand.id}>
                <Card className={isCurrent ? "overflow-hidden ring-2 ring-primary/40" : "overflow-hidden"}>
                  <div className="relative h-24 bg-surface">
                    {brand.cover && <Image src={brand.cover} alt="" fill unoptimized className="object-cover" />}
                  </div>
                  <div className="flex flex-col gap-4 p-5 pt-0">
                    <div className="-mt-8 flex items-end justify-between gap-3">
                      <BrandLogo id={brand.id} name={name} src={brand.logo} size="xl" className="border-4 border-card" />
                      {isCurrent && (
                        <Badge tone="brand" className="mb-1 gap-1">
                          <Check aria-hidden className="size-3.5" strokeWidth={3} />
                          {t("brandsPage.current")}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-h3 font-medium">{name}</h3>
                      <p className="text-small text-text-muted">
                        {t(`industries.${brand.industry}`)}
                        {t("common.separator")}
                        {f.pick(brand.city)}
                      </p>
                      {brand.about && <p className="mt-2 line-clamp-2 text-small text-text-muted">{f.pick(brand.about)}</p>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                      <span className="text-small text-text-muted">{tp("brandsPage.products", productsOf(brand.id).length)}</span>
                      <span className="flex gap-2">
                        {!isCurrent && (
                          <form action={selectBrand.bind(null, brand.id)}>
                            <button type="submit" aria-label={t("brandsPage.selectBrand", { name })} className={buttonClass("ghost")}>
                              {t("brandsPage.select")}
                            </button>
                          </form>
                        )}
                        <Link href={`/brands/${brand.id}/edit`} aria-label={t("brandsPage.editBrand", { name })} className={buttonClass("secondary")}>
                          <Pencil aria-hidden />
                          {t("brandsPage.edit")}
                        </Link>
                      </span>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="products-title">
        <SectionHeader id="products-title" title={t("brandsPage.productsOf", { brand: currentName })}>
          {products.length > 0 && (
            <LinkButton href="/brands/products/new" variant="primary" className="shrink-0">
              <Plus aria-hidden />
              {t("brandsPage.addProduct")}
            </LinkButton>
          )}
        </SectionHeader>
        {products.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} i18n={i18n} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t("brandsPage.noProducts")}
            hint={t("brandsPage.noProductsHint")}
            action={
              <LinkButton href="/brands/products/new">
                <Plus aria-hidden />
                {t("brandsPage.addProduct")}
              </LinkButton>
            }
          />
        )}
      </section>
    </div>
  );
}
