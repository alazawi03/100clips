import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function BrandNotFound() {
  const { t } = await getI18n();
  return <EmptyState title={t("common.notFound")} action={<LinkButton href="/dashboard">{t("nav.home")}</LinkButton>} />;
}
