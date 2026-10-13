import { redirect } from "next/navigation";
import { ProductForm } from "@/components/brand/products/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { myBrands } from "@/lib/data/brandsApi";
import { getI18n } from "@/lib/i18n/server";

/** Adds a product to the brand in ?brand=. A brand's first product is added in the brand wizard. */
export default async function NewProductPage({ searchParams }: PageProps<"/brands/products/new">) {
  const { t, f } = await getI18n();
  const raw = (await searchParams).brand;
  const brand = typeof raw === "string" ? (await myBrands()).find((b) => b.id === raw) : undefined;
  if (!brand) redirect("/brands");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("productForm.addTitle")} subtitle={t("productForm.subtitle", { brand: f.pick(brand.name) })} back={{ href: "/brands", label: t("brandsPage.title") }} />
      <ProductForm mode="create" brandId={brand.id} />
    </div>
  );
}
