import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { inviteToCampaign } from "@/app/actions/brand";
import { InviteForm } from "@/components/brand/campaigns/InviteForm";
import { inviteView, pickerLists } from "@/components/brand/campaigns/campaignView";
import { NICHES } from "@/lib/data/creatorFilters";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";
import { isActiveOrder } from "@/lib/statuses";

/**
 * Invite creators to an existing campaign, paid up front. Reached from the campaign's "Add creator"
 * (pick a list there), a list's "Invite to campaign" (?list=, all ticked), or a creator card or profile (?creators=).
 */
export default async function InvitePage({ params, searchParams }: PageProps<"/campaigns/[id]/invite">) {
  const { id } = await params;
  const ws = await workspace();
  const campaign = ws.campaign(id);
  if (!campaign || campaign.status !== "in_progress") notFound();
  const i18n = await getI18n();
  const { t, f } = i18n;
  const query = await searchParams;
  const inCampaign = new Set(ws.orders.filter((o) => o.campaignId === id && isActiveOrder(o)).map((o) => o.creatorId));
  const view = (c: (typeof ws.bookable)[number]) => inviteView(c, i18n, inCampaign.has(c.id));

  const lists = await pickerLists(ws, i18n, (creatorId) => inCampaign.has(creatorId));
  // ?creators=a,b from creator cards or a profile; ?list= from a list's "Invite to campaign".
  const presetIds = typeof query.creators === "string" ? query.creators.split(",") : [];
  const preset = ws.bookable.filter((c) => presetIds.includes(c.id));
  const listId = typeof query.list === "string" && lists.some((l) => l.id === query.list) ? query.list : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href={`/campaigns/${id}`} className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
          <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
          {f.pick(campaign.title)}
        </Link>
        <h1 className="text-h1 font-medium text-balance">{t("invite.title", { campaign: f.pick(campaign.title) })}</h1>
        <p className="text-text-muted">{t("invite.sameBrief")}</p>
      </header>
      <InviteForm
        action={inviteToCampaign.bind(null, id)}
        lists={lists}
        explore={{ creators: ws.bookable.map(view), niches: NICHES.map((n) => ({ id: n, label: t(`niches.${n}`) })) }}
        preset={preset.length > 0 ? preset.map(view) : undefined}
        initialListId={listId ?? lists.find((l) => l.creators.length > 0)?.id ?? "explore"}
        tickList={!!listId}
        balance={ws.balance}
      />
    </div>
  );
}
