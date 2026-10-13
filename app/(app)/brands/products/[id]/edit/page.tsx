import { notFound } from "next/navigation";
import { ProductForm } from "@/components/brand/products/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProduct } from "@/lib/data/brandsApi";
import { productToValues } from "@/lib/data/formValues";
import { getI18n } from "@/lib/i18n/server";

export default async function EditProductPage({ params }: PageProps<"/brands/products/[id]/edit">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const { t, f, locale } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("brandsPage.editProduct", { name: f.pick(product.name) })} back={{ href: "/brands", label: t("brandsPage.title") }} />
      <ProductForm mode="edit" productId={product.id} initial={productToValues(product, locale)} />
    </div>
  );
}
