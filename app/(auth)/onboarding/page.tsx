import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { BrandWizard } from "@/components/brand/brands/BrandWizard";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";
import { ensureBrandAccount } from "@/lib/session";

/** First time after sign-up: the account is made here, then the brand and its first product. */
export default async function OnboardingPage() {
  const { t } = await getI18n();
  const me = await ensureBrandAccount();
  if (me.account.role === "admin") redirect("/auth/brands-only");
  if (me.account.role === "creator") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("auth.creatorTitle")} />
        <Notice tone="info">{t("auth.creatorBody")}</Notice>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            {t("header.signOut")}
          </Button>
        </form>
      </div>
    );
  }
  if (me.brands.length > 0) redirect("/dashboard");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("brandForm.createTitle")} subtitle={t("brandForm.createSubtitle")} />
      <BrandWizard mode="onboarding" />
    </div>
  );
}