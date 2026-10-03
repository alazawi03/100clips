import { LinkButton } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

/** Stand-in for a page that a later section of the plan builds, so navigation never dead-ends. */
export async function Placeholder({ title, section }: { title: string; section: number }) {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <EmptyState
        title={t("placeholder.comingIn", { n: section })}
        action={
          <LinkButton href="/dashboard" variant="secondary">
            {t("placeholder.backToDashboard")}
          </LinkButton>
        }
      />
    </div>
  );
}
