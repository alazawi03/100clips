import { UserPlus } from "lucide-react";
import { ActionCallout, CalmCallout } from "@/components/brand/ActionCallout";
import { SectionHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { workspace } from "@/lib/data/live";
import type { Attention } from "@/lib/dashboard";
import type { I18n } from "@/lib/i18n/server";

/**
 * One callout per kind of thing the brand has to do, across all its campaigns. Same cards and words
 * as the campaign page's banner, plus declines on running campaigns (invite someone else).
 */
export async function NeedsYou({ items, i18n }: { items: Attention[]; i18n: I18n }) {
  const { t, tp, f } = i18n;
  const { creator } = await workspace();
  const names = (item: Attention) => item.orders.map((o) => f.pick(creator(o.creatorId)?.name ?? { ar: "", en: "" })).join(t("common.separator"));
  const button = (href: string, label: string) => (
    <LinkButton href={href} variant="primary" className="h-9 shrink-0 md:h-9">
      {label}
    </LinkButton>
  );

  return (
    <section aria-labelledby="needs-title">
      <SectionHeader id="needs-title" title={t("brandHome.needsTitle")} />
      {items.length === 0 ? (
        <CalmCallout>{t("flow.calm")}</CalmCallout>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const first = item.orders[0];
            const count = item.orders.length;
            if (item.kind === "declined") {
              return (
                <ActionCallout
                  key={`declined-${item.campaign.id}`}
                  icon={UserPlus}
                  title={tp("brandHome.needsDeclined", count, { name: names(item), campaign: f.pick(item.campaign.title) })}
                  detail={t("brandHome.declinedHint")}
                  action={button(`/campaigns/${item.campaign.id}/invite`, t("brandHome.inviteCreator"))}
                />
              );
            }
            const href = item.kind === "review" && count > 1 ? "/orders?status=delivered" : `/orders/${first.id}`;
            return (
              <ActionCallout
                key={item.kind}
                title={tp(`flow.group.${item.kind}`, count)}
                detail={`${names(item)} · ${tp("flow.waitingDays", item.waitingDays)}`}
                action={button(href, t(`flow.groupButton.${item.kind}`))}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
