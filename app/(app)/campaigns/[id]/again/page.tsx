import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { payCampaignAgain } from "@/app/actions/brand";
import { AgainForm } from "@/components/brand/campaigns/AgainForm";
import type { InviteCreator } from "@/components/brand/campaigns/InviteForm";
import { productOf } from "@/components/brand/campaigns/campaignView";
import { DEMO_TODAY, account } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { bookableCreators, getCreator, isBookable } from "@/lib/data/creators";
import { NICHES } from "@/lib/data/creatorFilters";
import { allLists, creatorsIn } from "@/lib/data/lists";
import { campaignCreators } from "@/lib/data/store";
import type { ContentFormat, Creator } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";
import { daysUntil } from "@/lib/orderFlow";

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * "Run again": a new campaign from this one, without the cart. This campaign's creators start ticked
 * with last time's platform, more can come from a list (lists only in the MVP), and the brief and
 * details are the same unless edited. The deadline is as far from today as it was last time.
 */
export default async function RunAgainPage({ params }: PageProps<"/campaigns/[id]/again">) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) notFound();
  const { t, f } = await getI18n();
  const { product } = productOf(campaign);

  const view = (c: Creator): InviteCreator => ({
    id: c.id,
    name: f.pick(c.name),
    handle: c.handle,
    city: f.pick(c.city),
    niches: c.niches,
    inCampaign: false,
    showsFace: c.showsFace,
    packages: c.formats.map((o) => ({ format: o.format, label: t(`formats.${o.format}`), price: o.price })),
  });
  const before = campaignCreators(id);
  // Suspended creators can't be booked again.
  const same = before.flatMap(({ creatorId }) => {
    const c = isBookable(creatorId) ? getCreator(creatorId) : undefined;
    return c ? [view(c)] : [];
  });
  // Last time's platform, if the creator still offers it.
  const defaultFormats: Record<string, ContentFormat> = Object.fromEntries(
    before.filter((b) => getCreator(b.creatorId)?.formats.some((o) => o.format === b.format)).map((b) => [b.creatorId, b.format]),
  );
  const lists = [
    { id: "same", name: t("again.sameCreators"), creators: same },
    ...allLists().map((l) => ({ id: l.id, name: l.favorites ? t("lists.favorites") : l.name, creators: creatorsIn(l).map(view) })),
  ];

  const span = campaign.deadline && campaign.createdAt ? Math.max(1, daysUntil(campaign.deadline, campaign.createdAt)) : undefined;
  const tomorrow = addDays(DEMO_TODAY, 1);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href={`/campaigns/${id}`} className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
          <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
          {f.pick(campaign.title)}
        </Link>
        <h1 className="text-h1 font-medium text-balance">{t("again.title", { campaign: f.pick(campaign.title) })}</h1>
        <p className="text-text-muted">{t("again.subtitle")}</p>
      </header>
      <AgainForm
        action={payCampaignAgain.bind(null, id)}
        lists={lists}
        explore={{ creators: bookableCreators().map(view), niches: NICHES.map((n) => ({ id: n, label: t(`niches.${n}`) })) }}
        defaultFormats={defaultFormats}
        defaults={{
          title: f.pick(campaign.title),
          brief: f.pick(campaign.brief),
          deadline: span ? addDays(DEMO_TODAY, span) : undefined,
          keyMessage: campaign.keyMessage,
          references: campaign.references ?? [],
          mustInclude: campaign.mustInclude,
          avoid: campaign.avoid,
          product: product ? f.pick(product.name) : undefined,
          videoStyle: campaign.videoStyle ? t(`checkout.videoStyles.${campaign.videoStyle}`) : undefined,
        }}
        minDeadline={tomorrow}
        balance={account.balance}
      />
    </div>
  );
}
