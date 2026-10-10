import { History } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/Card";
import type { AdminAction } from "@/lib/admin/data";
import type { I18n } from "@/lib/i18n/server";

/** What admins did here, newest first: the action, its details, and the note they left. */
export function ActivityList({ actions, i18n }: { actions: AdminAction[]; i18n: I18n }) {
  const { t, f } = i18n;
  const describe = (a: AdminAction) => {
    const [x, y] = (a.detail ?? "").split("|");
    switch (a.type) {
      case "payoutSent":
        return t("admin.activity.payoutSent", { amount: f.money(Number(x)), ref: y });
      case "deadlineExtended":
        return t("admin.activity.deadlineExtended", { date: f.date(y) });
      case "withdrawalSent":
        return t("admin.activity.withdrawalSent", { amount: f.money(Number(x)), ref: y });
      case "withdrawalRejected":
        return t("admin.activity.withdrawalRejected", { amount: f.money(Number(x)) });
      case "orderCancelled":
        return t("admin.activity.orderCancelled", { amount: f.money(Number(x)) });
      default:
        return t(`admin.activity.${a.type}`);
    }
  };
  return (
    <section aria-labelledby="activity-title">
      <SectionHeader id="activity-title" title={t("admin.activity.title")} hint={t("admin.activity.hint")} />
      {actions.length === 0 ? (
        <p className="text-small text-text-muted">{t("admin.activity.empty")}</p>
      ) : (
        <Card>
          <ol className="divide-y divide-border">
            {actions.map((a) => (
              <li key={a.id} className="flex gap-3 p-4 sm:px-5">
                <History aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{describe(a)}</p>
                  {a.note && <p className="text-small text-text-muted">“{a.note}”</p>}
                  <p className="text-caption text-text-muted">{f.messageTime(a.at, "")}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}
