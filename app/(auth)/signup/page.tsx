import { SignupForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function SignupPage() {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("auth.signupTitle")} subtitle={t("auth.signupSubtitle")} />
      <SignupForm />
    </div>
  );
}