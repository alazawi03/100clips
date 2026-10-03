import { CampaignForm } from "@/components/brand/campaigns/CampaignForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function NewCampaignPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("newCampaign.title")} subtitle={t("newCampaign.subtitle")} back={{ href: "/campaigns", label: t("campaignsPage.title") }} />
      <CampaignForm />
    </div>
  );
}
