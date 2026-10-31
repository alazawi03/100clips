import { LoginForm } from "@/components/auth/AuthForms";
import { PageHeader } from "@/components/ui/PageHeader";
import type { MessageKey } from "@/lib/i18n/messages";
import { getI18n } from "@/lib/i18n/server";

/** Why they're back at login (?error=): an expired link, an erased account. */
const ERRORS = {
  link: "auth.errors.linkExpired",
  erased: "auth.errors.erased",
} as const satisfies Record<string, MessageKey>;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getI18n();
  const { next, error } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")} />
      <LoginForm
        next={typeof next === "string" ? next : "/dashboard"}
        error={typeof error === "string" && error in ERRORS ? ERRORS[error as keyof typeof ERRORS] : undefined}
      />
    </div>
  );
}