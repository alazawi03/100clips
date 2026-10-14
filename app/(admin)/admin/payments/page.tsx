import { CreditCard } from "lucide-react";
import { settleCardPayment } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { getI18n } from "@/lib/i18n/server";

type AdminPayment = components["schemas"]["AdminPayment"];

/**
 * Card payments waiting to be confirmed. Until the card provider is connected (its webhook will do
 * this), an admin confirms each one once the money is in, or marks it failed. Oldest first.
 */
export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const { done } = await searchParams;
  const { t, f } = await getI18n();
  const waiting = (await api<AdminPayment[]>("/admin/payments?status=pending&limit=200")).toReversed();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.payments.title")} subtitle={t("admin.payments.subtitle")} />
      {done === "paid" && <Notice>{t("admin.payments.done")}</Notice>}
      {done === "failed" && <Notice>{t("admin.payments.doneFailed")}</Notice>}
      {done === "error" && <Notice tone="info">{t("admin.payments.error")}</Notice>}
      {waiting.length === 0 ? (
        <EmptyState title={t("admin.payments.empty")} />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {waiting.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
                  <CreditCard aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-medium">{f.pick({ ar: p.account.name_ar || p.account.name_en || "", en: p.account.name_en || p.account.name_ar || "" })}</p>
                  <p className="truncate text-small text-text-muted">
                    {p.kind === "checkout" ? t("admin.payments.checkout", { campaign: p.campaign_title ?? "" }) : t("admin.payments.topUp")}
                    {" · "}
                    {f.messageTime(p.created_at, p.created_at.slice(0, 10))}
                  </p>
                </div>
                <p className="text-small tabular-nums">{t("admin.payments.amounts", { card: f.money(p.by_card), total: f.money(p.total) })}</p>
                <div className="flex gap-2">
                  <form action={settleCardPayment.bind(null, p.id, "fail")}>
                    <Button type="submit" variant="ghost" className="h-9 md:h-9">
                      {t("admin.payments.fail")}
                    </Button>
                  </form>
                  <form action={settleCardPayment.bind(null, p.id, "confirm")}>
                    <Button type="submit" variant="primary" className="h-9 md:h-9">
                      {t("admin.payments.confirm")}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
