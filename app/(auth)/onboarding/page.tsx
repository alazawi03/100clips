import { BrandWizard } from "@/components/brand/brands/BrandWizard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

/** First time after sign-up: create the brand, then add its first product. */
export default async function OnboardingPage() {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("brandForm.createTitle")} subtitle={t("brandForm.createSubtitle")} />
      <BrandWizard mode="onboarding" />
    </div>
  );
}
