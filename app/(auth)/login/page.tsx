import { LoginForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getI18n();
  const { next, error } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")} />
      <LoginForm next={typeof next === "string" ? next : "/dashboard"} linkError={error === "link"} />
    </div>
  );
}