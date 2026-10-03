import { BrandWizard } from "@/components/brand/brands/BrandWizard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function NewBrandPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("brandForm.addTitle")} subtitle={t("brandForm.createSubtitle")} back={{ href: "/brands", label: t("brandsPage.title") }} />
      <BrandWizard mode="add" />
    </div>
  );
}
