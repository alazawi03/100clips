import { notFound } from "next/navigation";
import { BrandEditForm } from "@/components/brand/brands/BrandEditForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { myBrand } from "@/lib/data/brandsApi";
import { brandToValues } from "@/lib/data/formValues";
import { getI18n } from "@/lib/i18n/server";

export default async function EditBrandPage({ params }: PageProps<"/brands/[id]/edit">) {
  const { id } = await params;
  const brand = await myBrand(id);
  if (!brand) notFound();
  const { t, f, locale } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("brandForm.editTitle", { name: f.pick(brand.name) })} back={{ href: "/brands", label: t("brandsPage.title") }} />
      <BrandEditForm brandId={brand.id} initial={brandToValues(brand, locale)} />
    </div>
  );
}
