import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <EmptyState title={t("common.notFound")} action={<LinkButton href="/dashboard">{t("nav.home")}</LinkButton>} />
    </main>
  );
}
