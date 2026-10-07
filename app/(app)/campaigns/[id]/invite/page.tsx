import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { InviteForm, type InviteCreator } from "@/components/brand/campaigns/InviteForm";
import { account } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { creators as allCreators } from "@/lib/data/creators";
import { allLists, creatorsIn } from "@/lib/data/lists";
import { orders } from "@/lib/data/orders";
import type { Creator } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

/**
 * Invite creators to an existing campaign, paid up front. Reached from the campaign's "Add creator"
 * (pick a list there), a list's "Invite to campaign" (?list=, all ticked), or a creator card or profile (?creators=).
 */
export default async function InvitePage({ params, searchParams }: PageProps<"/campaigns/[id]/invite">) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign || campaign.status === "cancelled") notFound();
  const { t, f } = await getI18n();
  const query = await searchParams;
  const inCampaign = new Set(orders.filter((o) => o.campaignId === id && o.status !== "cancelled").map((o) => o.creatorId));

  const view = (c: Creator): InviteCreator => ({
    id: c.id,
    name: f.pick(c.name),
    city: f.pick(c.city),
    inCampaign: inCampaign.has(c.id),
    packages: c.formats.map((o) => ({ format: o.format, label: t(`formats.${o.format}`), price: o.price })),
  });

  const lists = allLists().map((l) => ({ id: l.id, name: l.favorites ? t("lists.favorites") : l.name, creators: creatorsIn(l).map(view) }));
  // ?creators=a,b from creator cards or a profile; ?list= from a list's "Invite to campaign".
  const presetIds = typeof query.creators === "string" ? query.creators.split(",") : [];
  const preset = allCreators.filter((c) => presetIds.includes(c.id));
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
        campaignId={id}
        lists={lists}
        preset={preset.length > 0 ? preset.map(view) : undefined}
        initialListId={listId ?? lists.find((l) => l.creators.length > 0)?.id}
        tickList={!!listId}
        balance={account.balance}
      />
    </div>
  );
}
