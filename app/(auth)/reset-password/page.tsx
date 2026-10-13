import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

/** Opened from the reset email: /auth/callback has already signed them in. */
export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("auth.resetTitle")} />
      <ResetPasswordForm />
    </div>
  );
}