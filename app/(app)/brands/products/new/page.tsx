import { ProductForm } from "@/components/brand/products/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { getI18n } from "@/lib/i18n/server";

/** Adds a product to the selected brand. A brand's first product is added in the brand wizard. */
export default async function NewProductPage() {
  const { t, f } = await getI18n();
  const brand = await getCurrentBrand();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("productForm.addTitle")} subtitle={t("productForm.subtitle", { brand: f.pick(brand.name) })} back={{ href: "/brands", label: t("brandsPage.title") }} />
      <ProductForm mode="create" />
    </div>
  );
}
